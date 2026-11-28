// A response-time line with an uptime strip underneath, drawn as plain SVG.
// No charting library: the whole thing is one component and a few lines of
// path maths, which keeps the bundle small and the behaviour easy to explain.

const WIDTH = 720;
const HEIGHT = 236;

const PAD_LEFT = 46;
const PAD_RIGHT = 10;

const CHART_TOP = 12;
const CHART_BOTTOM = 164;
const STRIP_TOP = 188;
const STRIP_HEIGHT = 18;
const AXIS_LABEL_Y = 224;

const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;

// Rounds a maximum up to something a person would write on an axis,
// so the top label is 300 rather than 287.
function niceCeiling(value) {
  if (value <= 0) {
    return 100;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step =
    normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;

  return step * magnitude;
}

const STRIP_STYLES = {
  up: "fill-emerald-500",
  partial: "fill-amber-400",
  down: "fill-red-500",
  none: "fill-slate-200",
};

function stripState(okRatio) {
  if (okRatio === null) {
    return "none";
  }

  if (okRatio >= 0.999) {
    return "up";
  }

  return okRatio > 0 ? "partial" : "down";
}

// Splits the points into runs of consecutive buckets that have data, so a gap
// in the checks is drawn as a break in the line instead of a straight jump.
function buildSegments(points, xOf, yOf) {
  const segments = [];
  let run = [];

  for (const [index, point] of points.entries()) {
    if (point.avgResponseTimeMs === null) {
      if (run.length > 0) {
        segments.push(run);
        run = [];
      }
      continue;
    }

    run.push([xOf(index), yOf(point.avgResponseTimeMs)]);
  }

  if (run.length > 0) {
    segments.push(run);
  }

  return segments;
}

function timeLabel(iso, spanHours) {
  const date = new Date(iso);
  const showsDay = spanHours > 24;

  return date.toLocaleString(undefined, {
    ...(showsDay ? { day: "numeric", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ResponseChart({ points, spanHours }) {
  const total = points.length;
  const cellWidth = PLOT_WIDTH / total;
  // A point sits in the middle of its bucket, so the line and the strip below
  // describe the same slice of time.
  const xOf = (index) => PAD_LEFT + (index + 0.5) * cellWidth;

  const values = points
    .map((point) => point.avgResponseTimeMs)
    .filter((value) => value !== null);

  if (values.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-medium">No checks in this window yet</p>
        <p className="mt-1 text-sm text-slate-600">
          The chart fills in after the monitor has been checked a few times.
        </p>
      </div>
    );
  }

  const yMax = niceCeiling(Math.max(...values) * 1.15);
  const yOf = (value) =>
    CHART_BOTTOM - (value / yMax) * (CHART_BOTTOM - CHART_TOP);

  const segments = buildSegments(points, xOf, yOf);
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((part) =>
    Math.round(yMax * part),
  );

  const firstPoint = points[0];
  const middlePoint = points[Math.floor(total / 2)];
  const lastPoint = points[total - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Average response time and uptime over the selected window"
        className="w-full"
        preserveAspectRatio="none"
      >
        {/* Horizontal grid, with a label on the left of each line. */}
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yOf(value)}
              y2={yOf(value)}
              className="stroke-slate-200"
              strokeWidth="1"
            />
            <text
              x={PAD_LEFT - 8}
              y={yOf(value) + 4}
              textAnchor="end"
              className="fill-slate-500 text-[11px]"
            >
              {value}
            </text>
          </g>
        ))}

        {/* One path per run of buckets that has data. */}
        {segments.map((segment, segmentIndex) =>
          segment.length === 1 ? (
            <circle
              key={segmentIndex}
              cx={segment[0][0]}
              cy={segment[0][1]}
              r="2.5"
              className="fill-slate-900"
            />
          ) : (
            <polyline
              key={segmentIndex}
              points={segment.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              className="stroke-slate-900"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ),
        )}

        {/* The uptime strip: one cell per bucket. */}
        {points.map((point, index) => {
          const state = stripState(point.okRatio);
          const when = timeLabel(point.at, spanHours);

          return (
            <rect
              key={`strip-${point.at}`}
              x={PAD_LEFT + index * cellWidth}
              y={STRIP_TOP}
              width={Math.max(cellWidth - 1, 0.5)}
              height={STRIP_HEIGHT}
              rx="2"
              className={STRIP_STYLES[state]}
            >
              <title>
                {state === "none"
                  ? `No checks at ${when}`
                  : `${Math.round(point.okRatio * 100)}% of ${point.checks} checks passed at ${when}`}
              </title>
            </rect>
          );
        })}

        {/* Three time labels are enough to read the axis without crowding it. */}
        {[
          [PAD_LEFT, firstPoint.at],
          [PAD_LEFT + PLOT_WIDTH / 2, middlePoint.at],
          [WIDTH - PAD_RIGHT, lastPoint.at],
        ].map(([x, at], index) => (
          <text
            key={`tick-${index}`}
            x={x}
            y={AXIS_LABEL_Y}
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
            className="fill-slate-500 text-[11px]"
          >
            {timeLabel(at, spanHours)}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> All checks
          passed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-amber-400" /> Some failed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-red-500" /> All failed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-200" /> No checks
        </span>
        <span className="ml-auto text-slate-500">
          Y axis: response time in ms
        </span>
      </div>
    </div>
  );
}

// One icon set, so every icon has the same stroke style.
// Each value is the "d" attribute of an SVG path.
const shapes = {
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  profile:
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 0-8 0a4 4 0 1 0 8 0",
  info: "M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  incidents:
    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  settings:
    "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M13 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  "arrow-left": "M19 12H5M12 19l-7-7 7-7",
  "chevron-down": "M6 9l6 6 6-6",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  "arrow-up": "M12 19V5M5 12l7-7 7 7",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  github:
    "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  linkedin:
    "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM6 4a2 2 0 1 0-4 0a2 2 0 1 0 4 0",
  clock: "M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20zM12 6v6l4 2",
  chart: "M18 20V10M12 20V4M6 20v-6",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  globe:
    "M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  register:
    "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 0-8 0a4 4 0 1 0 8 0M20 8v6M23 11h-6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const NavIcon = ({ name, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={shapes[name]} />
  </svg>
);

export default NavIcon;

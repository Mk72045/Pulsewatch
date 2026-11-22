// Turns a date from the backend into text such as "just now" or "5 min ago".
export function timeAgo(dateString) {
  const elapsed = Date.now() - new Date(dateString).getTime();
  // Math.max keeps it at 0 if the browser clock is a little behind the server.
  const seconds = Math.max(0, Math.round(elapsed / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} h ago`;
  }

  return `${Math.floor(hours / 24)} d ago`;
}

// "12 min", "2 h 5 min" or "1 d 3 h". A resolvedAt of null means the incident
// is still going, so it is counted until now.
export function formatDuration(startedAt, resolvedAt) {
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const totalMinutes = Math.max(
    1,
    Math.round((end - new Date(startedAt).getTime()) / 60_000),
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);

  if (hours < 24) {
    return `${hours} h ${totalMinutes % 60} min`;
  }

  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

// "22 Nov 2026, 12:53 AM", in the time zone of the browser.
export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

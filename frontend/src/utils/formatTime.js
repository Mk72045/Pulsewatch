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
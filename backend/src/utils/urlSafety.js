// Returns a URL object for http and https addresses, or null for anything else.
export function parseHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// True for addresses that point inside a network instead of at the public
// internet: localhost, private ranges and the cloud metadata address.
// A server that fetches user-supplied URLs must not reach these (SSRF).
export function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv6 addresses arrive in square brackets. They are not accepted at all.
  if (host.startsWith("[")) {
    return true;
  }

  const parts = host.split(".").map(Number);
  const isIpv4 =
    parts.length === 4 &&
    parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);

  if (!isIpv4) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

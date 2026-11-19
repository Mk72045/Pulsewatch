import net from "node:net";

// Returns a URL object for http and https addresses, or null for anything else.
export function parseHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// True for IPv4 addresses that point inside a network: private ranges,
// loopback and the cloud metadata address.
function isPrivateIpv4(address) {
  const [first, second] = address.split(".").map(Number);

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

// For the host as it is written in a URL. A server that fetches user-supplied
// URLs must not reach private places (SSRF).
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

  // IPv6 addresses arrive in square brackets. They are not accepted in a URL.
  if (host.startsWith("[")) {
    return true;
  }

  return net.isIPv4(host) && isPrivateIpv4(host);
}

// For an address that DNS returned for a name. This catches names that look
// harmless but point to a private address.
export function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    return isPrivateIpv4(address);
  }

  // Only public IPv6 addresses (the range 2000::/3, which starts with 2 or 3)
  // are allowed. Loopback, private and link-local ones are all rejected.
  return !/^[23]/i.test(address);
}

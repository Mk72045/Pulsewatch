import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import { env } from "../config/env.js";
import {
  isPrivateAddress,
  isPrivateHost,
  parseHttpUrl,
} from "../utils/urlSafety.js";

// Node calls this to turn a domain into an IP address, right when it connects.
// Checking here means we check the exact address that is really used, so a
// domain that changes its answer between our check and the connection (DNS
// rebinding) cannot trick us into reaching a private address.
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, options, (error, address, family) => {
    if (error) {
      callback(error);
      return;
    }

    // With options.all the answer is a list of addresses, otherwise a single one.
    const addresses = Array.isArray(address)
      ? address.map((item) => item.address)
      : [address];

    if (addresses.some(isPrivateAddress)) {
      const blocked = new Error("Blocked address");
      blocked.code = "BLOCKED_ADDRESS";
      callback(blocked);
      return;
    }

    callback(null, address, family);
  });
}

const errorMessages = {
  BLOCKED_ADDRESS: "Address is not allowed",
  ENOTFOUND: "Domain not found",
  EAI_AGAIN: "DNS lookup failed",
  ECONNREFUSED: "Connection refused",
  ECONNRESET: "Connection reset",
  ETIMEDOUT: "Connection timed out",
  EHOSTUNREACH: "Host unreachable",
  CERT_HAS_EXPIRED: "SSL certificate has expired",
  DEPTH_ZERO_SELF_SIGNED_CERT: "SSL certificate is self-signed",
  SELF_SIGNED_CERT_IN_CHAIN: "SSL certificate is self-signed",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "SSL certificate cannot be verified",
  ERR_TLS_CERT_ALTNAME_INVALID: "SSL certificate does not match the domain",
};

// Short and safe text for the user. Internal error details never leave here.
function describeError(error) {
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return `Timed out after ${env.CHECK_TIMEOUT_MS / 1000}s`;
  }

  // On computers with IPv4 and IPv6, the real code can sit inside a list.
  const code = error.code ?? error.errors?.[0]?.code;

  return errorMessages[code] ?? "Request failed";
}

// Checks one URL and always resolves, it never throws.
export function checkUrl(value) {
  return new Promise((resolve) => {
    const url = parseHttpUrl(value);

    // The address as written in the URL, such as localhost or 10.0.0.5.
    if (!url || isPrivateHost(url.hostname)) {
      resolve({
        ok: false,
        statusCode: null,
        responseTimeMs: null,
        error: "Address is not allowed",
      });
      return;
    }

    const client = url.protocol === "https:" ? https : http;
    const startedAt = performance.now();

    const request = client.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        agent: false,
        signal: AbortSignal.timeout(env.CHECK_TIMEOUT_MS),
        headers: { "User-Agent": "Pulsewatch/1.0 (uptime monitor)" },
      },
      (response) => {
        const responseTimeMs = Math.round(performance.now() - startedAt);
        const statusCode = response.statusCode;
        const ok = statusCode >= 200 && statusCode < 400;

        // The page itself is not needed. Closing the connection stops the download.
        response.destroy();

        resolve({
          ok,
          statusCode,
          responseTimeMs,
          error: ok ? null : `HTTP ${statusCode}`,
        });
      },
    );

    request.on("error", (error) => {
      resolve({
        ok: false,
        statusCode: null,
        responseTimeMs: null,
        error: describeError(error),
      });
    });

    request.end();
  });
}

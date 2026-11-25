import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

// True when GOOGLE_CLIENT_ID is set. The Google endpoints answer 503 without
// it, the same way mail and Telegram features switch themselves off.
export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID);

// One client for the whole process. It caches Google's signing keys, so a
// token can be checked without asking Google again on every request.
const client = googleEnabled ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

// Checks a Google ID token and returns the person behind it.
//
// verifyIdToken does the security work: it checks the signature against
// Google's published keys, the issuer, the expiry, and that the token was
// issued for THIS app (the audience). A token for another site fails.
//
// It never returns anything that was not proven to come from Google.
export async function verifyGoogleCredential(credential) {
  if (!googleEnabled) {
    throw new ApiError(
      503,
      "Google sign-in is not available right now. Use email and password",
    );
  }

  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch {
    // Wrong signature, expired, wrong audience: all mean "not a real login".
    throw new ApiError(401, "That Google sign-in could not be verified");
  }

  if (!payload?.sub || !payload?.email) {
    throw new ApiError(401, "That Google sign-in could not be verified");
  }

  // Google reports whether it has verified the address. A token without a
  // verified email must not be trusted to attach to an existing account.
  if (!payload.email_verified) {
    throw new ApiError(
      403,
      "Your Google email is not verified. Verify it with Google first",
    );
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
  };
}

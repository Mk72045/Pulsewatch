import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const mailEnabled = Boolean(env.BREVO_API_KEY && env.MAIL_FROM_EMAIL);

// Sends one email through Brevo's HTTP API (port 443), so it also works on
// hosts that block SMTP. It makes ONE attempt and never throws. It returns
// { ok, error }. When to try again is decided by the outbox.
export async function sendMail({ to, subject, text }) {
  if (!mailEnabled) {
    return { ok: false, error: "Email is not configured" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      logger.info({ subject }, "Alert email sent");
      return { ok: true, error: null };
    }

    const detail = await response.text();
    logger.warn(
      { status: response.status, detail },
      "Brevo rejected the email",
    );

    return { ok: false, error: `Brevo answered ${response.status}` };
  } catch (error) {
    logger.warn({ err: error }, "Sending email failed");

    return { ok: false, error: "Could not reach Brevo" };
  }
}

import { env } from "../config/env.js";
import { OTP_EXPIRES_MINUTES } from "../config/constants.js";

// Every email is built the same way: a plain text version for clients that
// cannot show HTML, and a simple HTML version using inline styles (email
// clients ignore <style> blocks and external CSS).

// A monitor name or user name typed by a user could hold HTML, so it is
// escaped before it is placed in the HTML part.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title, bodyHtml) {
  return [
    '<div style="background:#f8fafc;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">',
    '<div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;color:#0f172a;">',
    `<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">${title}</h1>`,
    bodyHtml,
    '<p style="margin:28px 0 0;font-size:12px;color:#64748b;">',
    `${escapeHtml(env.MAIL_FROM_NAME)} - uptime monitoring`,
    "</p>",
    "</div>",
    "</div>",
  ].join("");
}

export function verificationEmail({ name, code }) {
  const minutes = OTP_EXPIRES_MINUTES;
  const safeName = escapeHtml(name);

  return {
    subject: `${code} is your ${env.MAIL_FROM_NAME} verification code`,
    text: [
      `Hi ${name},`,
      "",
      `Your verification code is: ${code}`,
      "",
      `Enter it on the verification page to finish creating your account. The code expires in ${minutes} minutes.`,
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: layout(
      "Confirm your email",
      [
        `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Hi ${safeName},</p>`,
        '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Your verification code is:</p>',
        '<p style="margin:0 0 16px;font-size:32px;font-weight:600;letter-spacing:8px;text-align:center;padding:16px;background:#f1f5f9;border-radius:8px;">',
        escapeHtml(code),
        "</p>",
        `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">The code expires in ${minutes} minutes.</p>`,
        '<p style="margin:0;font-size:13px;color:#64748b;">If you did not create this account, you can ignore this email.</p>',
      ].join(""),
    ),
  };
}

export function welcomeEmail({ name }) {
  const dashboard = `${env.CLIENT_URL}/dashboard`;
  const safeName = escapeHtml(name);
  const safeDashboard = escapeHtml(dashboard);

  return {
    subject: `Welcome to ${env.MAIL_FROM_NAME}, ${name}`,
    text: [
      `Hi ${name},`,
      "",
      `Welcome to ${env.MAIL_FROM_NAME}. Your email is confirmed and your account is ready.`,
      "",
      "Add your first monitor and you will get an alert the moment a site goes down.",
      "",
      `Open your dashboard: ${dashboard}`,
    ].join("\n"),
    html: layout(
      `Welcome to ${escapeHtml(env.MAIL_FROM_NAME)}`,
      [
        `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Hi ${safeName},</p>`,
        '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Your email is confirmed and your account is ready.</p>',
        '<p style="margin:0 0 24px;font-size:14px;line-height:1.6;">Add your first monitor and you will get an alert the moment a site goes down.</p>',
        `<a href="${safeDashboard}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Open your dashboard</a>`,
      ].join(""),
    ),
  };
}

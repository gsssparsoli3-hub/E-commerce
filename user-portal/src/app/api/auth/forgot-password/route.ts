import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, serverError, isEmail } from "@/lib/api-helpers";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailButton } from "@/lib/email";

/** Minimal HTML escaping for user-provided values interpolated into emails. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c
  ));
}

/**
 * POST /api/auth/forgot-password
 * Emails a password reset link (valid 1 hour). Always returns the same
 * response whether or not the email is registered — never leak which
 * accounts exist (prevents email enumeration).
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "forgot-password"), 5, 10 * 60_000)) {
      return badRequest("Too many attempts. Please wait a few minutes and try again.");
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isEmail(email)) return badRequest("Please enter a valid email address");

    // Mirror the login lookup — emails are stored lowercase
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      // ~72 chars of entropy: a UUID plus a second UUID with dashes stripped
      const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

      // One outstanding link per user — invalidate previous unused tokens
      await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const origin = req.headers.get("origin") || req.nextUrl.origin;
      const resetUrl = `${origin}/#/reset-password?token=${token}`;

      // sendEmail is a safe no-op (returns false) when SMTP is unconfigured,
      // and logs instead of throwing on failure — ignore the result.
      await sendEmail({
        to: user.email,
        subject: "Reset your Shoperic password",
        html: `
          <p>Hi ${escapeHtml(user.name.split(" ")[0])},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          ${emailButton(resetUrl, "Reset Password")}
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    }

    // Same response either way — never reveal whether the email exists
    return json({ ok: true, message: "If an account exists with this email, we've sent a reset link." });
  } catch (error) {
    return serverError(error);
  }
}

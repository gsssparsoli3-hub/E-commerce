import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, badRequest, serverError } from "@/lib/api-helpers";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const INVALID_LINK = "This reset link is invalid or has expired. Please request a new one.";

/**
 * POST /api/auth/reset-password
 * Consumes a single-use reset token, sets the new password, and invalidates
 * every other outstanding link for that account.
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "reset-password"), 10, 10 * 60_000)) {
      return badRequest("Too many attempts. Please wait a few minutes and try again.");
    }

    const body = await req.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token) return badRequest(INVALID_LINK);
    if (password.length < 8) return badRequest("Password must be at least 8 characters");

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return badRequest(INVALID_LINK);
    }

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: bcrypt.hashSync(password, 10) },
      }),
      // Single-use: consume this token…
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // …and invalidate any other outstanding links for the account
      db.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id } },
      }),
    ]);

    return json({ ok: true, message: "Password updated. You can now sign in." });
  } catch (error) {
    return serverError(error);
  }
}

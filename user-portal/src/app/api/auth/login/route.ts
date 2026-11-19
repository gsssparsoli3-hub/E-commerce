import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, badRequest, serverError, isEmail, unauthorized } from "@/lib/api-helpers";
import { signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "login"), 10, 60_000)) {
      return badRequest("Too many attempts. Please try again in a minute.");
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!isEmail(email) || !password) return badRequest("Enter a valid email and password");

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return unauthorized("Incorrect email or password");
    }
    if (user.status === "BLOCKED") {
      return unauthorized("Your account has been blocked. Contact support.");
    }

    const safeUser = {
      id: user.id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, avatar: user.avatar,
    };
    const token = await signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);
    return json({ user: safeUser, token }); // token returned for mobile clients
  } catch (error) {
    return serverError(error);
  }
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, badRequest, serverError, isEmail } from "@/lib/api-helpers";
import { signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "register"), 6, 60_000)) {
      return badRequest("Too many attempts. Please try again in a minute.");
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = body.phone ? String(body.phone).trim() : null;

    if (name.length < 2) return badRequest("Please enter your full name");
    if (!isEmail(email)) return badRequest("Please enter a valid email address");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return badRequest("An account with this email already exists. Try signing in.");

    const user = await db.user.create({
      data: { name, email, password: bcrypt.hashSync(password, 10), phone },
    });

    const safeUser = {
      id: user.id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, avatar: user.avatar,
    };
    const token = await signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);
    return json({ user: safeUser, token });
  } catch (error) {
    return serverError(error);
  }
}

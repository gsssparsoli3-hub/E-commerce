import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "shoperic-dev-secret-change-me-in-production-9f8e7d6c5b"
);
export const AUTH_COOKIE = "shoperic_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
};

export async function signToken(payload: { sub: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { sub: string; role: string; exp: number };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/**
 * Resolve the current user from httpOnly cookie (web) or Bearer token (mobile apps).
 */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  let token: string | undefined;
  const store = await cookies();
  token = store.get(AUTH_COOKIE)?.value;

  if (!token && req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  }

  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, status: true, avatar: true,
    },
  });

  if (!user || user.status === "BLOCKED") return null;
  return user;
}

export async function requireUser(req?: Request) {
  const user = await getSessionUser(req);
  if (!user) return null;
  return user;
}

export async function requireAdmin(req?: Request) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

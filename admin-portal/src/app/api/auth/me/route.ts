import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { json, unauthorized } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();
  return json({ user });
}

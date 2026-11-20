import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const body = await req.json();
    const updates: { name?: string; phone?: string | null; password?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return badRequest("Name must be at least 2 characters");
      updates.name = name;
    }
    if (body.phone !== undefined) {
      updates.phone = String(body.phone).trim() || null;
    }
    if (body.newPassword) {
      const current = String(body.currentPassword ?? "");
      const record = await db.user.findUnique({ where: { id: session.id } });
      if (!record || !bcrypt.compareSync(current, record.password)) {
        return badRequest("Current password is incorrect");
      }
      if (String(body.newPassword).length < 6) {
        return badRequest("New password must be at least 6 characters");
      }
      updates.password = bcrypt.hashSync(String(body.newPassword), 10);
    }

    const user = await db.user.update({
      where: { id: session.id },
      data: updates,
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
    });
    return json({ user });
  } catch (error) {
    return serverError(error);
  }
}

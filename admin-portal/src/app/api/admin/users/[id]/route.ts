import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — block/unblock or change role
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    if (id === admin.id) return badRequest("You cannot modify your own admin account here");

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return notFound("User not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined && ["ACTIVE", "BLOCKED"].includes(body.status)) data.status = body.status;
    if (body.role !== undefined && ["CUSTOMER", "ADMIN"].includes(body.role)) data.role = body.role;

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    return json({ user: updated });
  } catch (error) {
    return serverError(error);
  }
}

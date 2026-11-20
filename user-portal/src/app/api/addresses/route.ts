import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

function validateAddress(body: Record<string, unknown>) {
  const fields = ["fullName", "phone", "line1", "city", "state", "pincode"] as const;
  for (const f of fields) {
    if (!String(body[f] ?? "").trim()) return `${f} is required`;
  }
  if (!/^\d{6}$/.test(String(body.pincode))) return "Enter a valid 6-digit pincode";
  if (!/^\+?[\d\s-]{10,15}$/.test(String(body.phone))) return "Enter a valid phone number";
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return json({ addresses: [] });

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" },
    ]});
    return json({ addresses });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "addresses"), 20, 60_000)) {
      return badRequest("Too many requests. Please wait a minute and try again.");
    }

    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const error = validateAddress(body);
    if (error) return badRequest(error);

    const count = await db.address.count({ where: { userId: user.id } });
    const makeDefault = body.isDefault === true || count === 0;

    if (makeDefault) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await db.address.create({
      data: {
        userId: user.id,
        fullName: String(body.fullName).trim(),
        phone: String(body.phone).trim(),
        line1: String(body.line1).trim(),
        line2: body.line2 ? String(body.line2).trim() : null,
        city: String(body.city).trim(),
        state: String(body.state).trim(),
        pincode: String(body.pincode).trim(),
        country: "India",
        isDefault: makeDefault,
      },
    });
    return json({ address });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "addresses"), 20, 60_000)) {
      return badRequest("Too many requests. Please wait a minute and try again.");
    }

    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const id = String(body.id ?? "");
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound("Address not found");

    const error = validateAddress(body);
    if (error) return badRequest(error);

    if (body.isDefault === true) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await db.address.update({
      where: { id },
      data: {
        fullName: String(body.fullName).trim(),
        phone: String(body.phone).trim(),
        line1: String(body.line1).trim(),
        line2: body.line2 ? String(body.line2).trim() : null,
        city: String(body.city).trim(),
        state: String(body.state).trim(),
        pincode: String(body.pincode).trim(),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault === true } : {}),
      },
    });
    return json({ address });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return badRequest("id is required");

    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return notFound("Address not found");

    await db.address.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

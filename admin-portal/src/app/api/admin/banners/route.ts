import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/banners — all banners incl. hidden
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const banners = await db.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
    return json({ banners });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/admin/banners
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const image = String(body.image ?? "").trim();
    if (title.length < 2) return badRequest("Banner title is required");
    if (!image) return badRequest("Banner image is required");

    const banner = await db.banner.create({
      data: {
        title,
        subtitle: body.subtitle ? String(body.subtitle).trim() : null,
        image,
        link: body.link ? String(body.link).trim() : null,
        ctaText: body.ctaText ? String(body.ctaText).trim() : "Shop Now",
        position: body.position === "STRIP" ? "STRIP" : "HERO",
        sortOrder: Number(body.sortOrder) || 0,
        status: body.status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
      },
    });
    return json({ banner });
  } catch (error) {
    return serverError(error);
  }
}

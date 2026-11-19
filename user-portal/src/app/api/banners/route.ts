import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, serverError } from "@/lib/api-helpers";

// GET /api/banners — active banners, optionally by position
export async function GET(req: NextRequest) {
  try {
    const position = req.nextUrl.searchParams.get("position");
    const banners = await db.banner.findMany({
      where: { status: "ACTIVE", ...(position ? { position } : {}) },
      orderBy: { sortOrder: "asc" },
    });
    return json({ banners });
  } catch (error) {
    return serverError(error);
  }
}

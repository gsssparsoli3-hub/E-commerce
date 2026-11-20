import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cachedJson, serverError } from "@/lib/api-helpers";

// GET /api/banners — active banners, optionally by position (cached 5min)
export async function GET(req: NextRequest) {
  try {
    const position = req.nextUrl.searchParams.get("position");
    const banners = await db.banner.findMany({
      where: { status: "ACTIVE", ...(position ? { position } : {}) },
      orderBy: { sortOrder: "asc" },
    });
    return cachedJson({ banners }, { sMaxage: 300, swr: 600 });
  } catch (error) {
    return serverError(error);
  }
}

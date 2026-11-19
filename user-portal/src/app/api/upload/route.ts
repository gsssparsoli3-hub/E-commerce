import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { json, badRequest, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload — admin-only image upload (products, banners, branding)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden("Admin access required");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("No file provided");
    if (!ALLOWED_TYPES.includes(file.type)) return badRequest("Only JPG, PNG, WebP, GIF, SVG or ICO images are allowed");
    if (file.size > MAX_SIZE) return badRequest("Image must be smaller than 5MB");

    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    return json({ url: `/uploads/${filename}` });
  } catch (error) {
    return serverError(error);
  }
}

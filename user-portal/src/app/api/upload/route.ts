import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { json, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = "uploads";

/**
 * Upload to Supabase Storage (production path). Returns the public URL, or
 * null when Supabase is not configured (falls back to local disk in dev).
 * Mirrors admin-portal/src/app/api/upload/route.ts — both portals share the
 * same `uploads` bucket so images uploaded from either portal are live.
 */
let bucketReady = false;
async function supabaseUpload(file: File, filename: string): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const base = supabaseUrl.replace(/\/$/, "");
  const auth = { Authorization: `Bearer ${serviceKey}` };

  // Ensure a public bucket exists (idempotent, checked once per process).
  if (!bucketReady) {
    const check = await fetch(`${base}/storage/v1/bucket/${BUCKET}`, { headers: auth });
    if (check.status === 404 || check.status === 400) {
      await fetch(`${base}/storage/v1/bucket`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ name: BUCKET, public: true }),
      }).catch(() => null);
    }
    bucketReady = true;
  }

  const up = await fetch(`${base}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
    body: await file.arrayBuffer(),
  });
  if (!up.ok) {
    const detail = await up.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${up.status}) ${detail.slice(0, 120)}`);
  }
  return `${base}/storage/v1/object/public/${BUCKET}/${filename}`;
}

/** Local-disk fallback (development only — Vercel has a read-only filesystem). */
async function localUpload(file: File, filename: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

// POST /api/upload — logged-in users can upload (avatars, review images)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to upload images");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("No file provided");
    if (!ALLOWED_TYPES.includes(file.type)) return badRequest("Only JPG, PNG, WebP, GIF, SVG or ICO images are allowed");
    if (file.size > MAX_SIZE) return badRequest("Image must be smaller than 5MB");

    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    try {
      const url = (await supabaseUpload(file, filename)) ?? (await localUpload(file, filename));
      return json({ url });
    } catch (uploadError) {
      return badRequest(uploadError instanceof Error ? uploadError.message : "Upload failed");
    }
  } catch (error) {
    return serverError(error);
  }
}

import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Cached JSON helper for public GET endpoints. Adds Cache-Control + SWR headers. */
export function cachedJson(data: unknown, opts: { sMaxage?: number; swr?: number } = {}) {
  const sMaxage = opts.sMaxage ?? 60;
  const swr = opts.swr ?? 300;
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`,
    },
  });
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Please sign in to continue") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error?: unknown) {
  console.error("[api]", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

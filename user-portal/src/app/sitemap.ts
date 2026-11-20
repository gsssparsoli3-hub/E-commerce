import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Origin used when neither the admin settings (SiteSetting.storeUrl) nor the
// deploy environment (NEXT_PUBLIC_SITE_URL) provide a usable value.
// Mirrors the fallback in robots.ts and layout.tsx.
const FALLBACK_SITE_URL = "https://shoperic.vercel.app";

// Revalidate hourly so catalog/settings changes refresh the sitemap without a
// redeploy (matches the revalidate cadence used by the root layout/page).
export const revalidate = 3600;

/**
 * Validates a candidate canonical origin (e.g. "https://www.yourstore.com").
 * storeUrl is admin-entered and can be malformed ("/", "https://", a bare
 * hostname…), so every candidate is parsed defensively. Returns the origin
 * string, or null when the value is missing/unusable.
 */
function toSiteOrigin(candidate: string | null | undefined): string | null {
  const trimmed = candidate?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) {
      return null;
    }
    return url.origin;
  } catch {
    return null; // relative or unparseable — not a usable origin
  }
}

/**
 * The storefront uses client-side hash routing (#/product/<slug>, #/shop, …).
 * URL fragments are separate "pages" only inside the SPA — search engines do
 * not reliably index them as distinct URLs — so this sitemap lists only the
 * single server-rendered entry page ("/"). Its lastModified is the newest
 * active product's updatedAt so crawlers re-fetch the home page whenever the
 * catalog changes.
 *
 * TODO: when the app moves to path-based routing, enumerate per-product URLs:
 *   entries.push({
 *     url: `${siteUrl}/product/${p.slug}`,
 *     lastModified: p.updatedAt,
 *     changeFrequency: "weekly",
 *     priority: 0.8,
 *   });
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Canonical origin resolution order: SiteSetting.storeUrl →
  // NEXT_PUBLIC_SITE_URL → hardcoded fallback.
  let siteUrl =
    toSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? FALLBACK_SITE_URL;
  let lastModified = new Date(); // safe default when the DB is unreachable

  try {
    const [settings, newestProduct] = await Promise.all([
      db.siteSetting.findUnique({
        where: { id: "singleton" },
        select: { storeUrl: true },
      }),
      db.product.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    const storeUrl = toSiteOrigin(settings?.storeUrl);
    if (storeUrl) siteUrl = storeUrl;
    if (newestProduct) lastModified = newestProduct.updatedAt;
  } catch {
    // database unavailable — keep env/fallback origin and "now" timestamp
  }

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

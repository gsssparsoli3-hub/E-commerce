import type { MetadataRoute } from "next";

// NOTE: robots.ts is generated without database access, so the canonical
// origin is resolved from the environment only. Production deploys should set
// NEXT_PUBLIC_SITE_URL (e.g. https://www.yourstore.com) so the Sitemap
// directive points at the right host; otherwise the default is used.
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://shoperic.vercel.app"
).replace(/\/+$/, ""); // normalize trailing slash

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/* is JSON-only (no crawlable content); /admin is the admin
        // console (proxied in dev, separate domain in production).
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

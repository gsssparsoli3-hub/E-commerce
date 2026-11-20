import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EcommerceApp } from "@/components/ecommerce/app";

// Revalidate every hour so admin branding/SEO changes propagate without a redeploy.
export const revalidate = 3600;

// SEO metadata is fully controlled by the admin (Settings → SEO).
async function getSettings() {
  try {
    return await db.siteSetting.findUnique({ where: { id: "singleton" } });
  } catch {
    return null;
  }
}

// First active HERO banner (ordered by sortOrder) doubles as the social-share
// image; falls back to a bundled brand banner when none exists or the DB is
// unreachable. (Mirrors the og:image resolution in the root layout — page-level
// openGraph/twitter objects fully replace the layout's, so both must set it.)
async function getOgImage() {
  try {
    const banner = await db.banner.findFirst({
      where: { position: "HERO", status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { image: true },
    });
    return banner?.image || "/brand/banner-sale.jpg";
  } catch {
    return "/brand/banner-sale.jpg";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [s, ogImage] = await Promise.all([getSettings(), getOgImage()]);
  const name = s?.siteName ?? "Shoperic";
  const title = s?.seoTitle || `${name} — ${s?.tagline ?? "Online Shopping"}`;
  const description = s?.seoDescription || s?.tagline || "Shop the best products at the best prices.";
  const keywords = (s?.seoKeywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    // Admin-uploaded favicon wins; otherwise the runtime /icon route generates
    // a branded letter-icon from siteName + primaryColor (see src/app/icon.tsx).
    icons: { icon: s?.faviconUrl || "/icon" },
    openGraph: {
      title,
      description,
      siteName: name,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogImage }],
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page() {
  const s = await getSettings();
  const name = s?.siteName ?? "Shoperic";

  // Organization structured data for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: s?.tagline ?? undefined,
    email: s?.supportEmail ?? undefined,
    telephone: s?.supportPhone ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EcommerceApp />
    </>
  );
}

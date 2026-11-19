import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EcommerceApp } from "@/components/ecommerce/app";

// SEO metadata is fully controlled by the admin (Settings → SEO).
async function getSettings() {
  try {
    return await db.siteSetting.findUnique({ where: { id: "singleton" } });
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
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
    icons: { icon: s?.faviconUrl || "/brand/favicon.svg" },
    openGraph: {
      title,
      description,
      siteName: name,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
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

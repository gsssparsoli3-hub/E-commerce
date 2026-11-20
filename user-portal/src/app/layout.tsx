import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Revalidate branding/SEO metadata hourly so admin changes propagate without a redeploy.
export const revalidate = 3600;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default canonical origin, mirroring sitemap.ts / robots.ts. Deployments
// should set NEXT_PUBLIC_SITE_URL (or the admin's storeUrl setting) instead.
const FALLBACK_SITE_URL = "https://shoperic.vercel.app";

/**
 * Resolves the metadataBase used to make relative metadata URLs (canonical,
 * og:image…) absolute. storeUrl is admin-entered and can be malformed (e.g.
 * "/" or "https://"), so candidates are validated in priority order —
 * resolved siteUrl → NEXT_PUBLIC_SITE_URL → fallback — same chain as
 * sitemap.ts.
 */
function toMetadataBase(siteUrl: string | undefined): URL {
  const candidates = [siteUrl, process.env.NEXT_PUBLIC_SITE_URL, FALLBACK_SITE_URL];
  for (const candidate of candidates) {
    try {
      const url = new URL((candidate ?? "").trim().replace(/\/+$/, ""));
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname) {
        return new URL(url.origin);
      }
    } catch {
      // unparseable — try the next candidate
    }
  }
  return new URL(FALLBACK_SITE_URL); // unreachable — FALLBACK is always valid
}

/** SEO metadata is admin-controlled (Settings → SEO in the admin console). */
export async function generateMetadata(): Promise<Metadata> {
  let title = "Shoperic — Online Shopping";
  let description = "Shop electronics, fashion, home essentials and more.";
  let keywords: string | undefined;
  // Default: runtime-generated branded letter-icon (see src/app/icon.tsx).
  let icons: Metadata["icons"] = [{ url: "/icon", type: "image/png" }];
  let siteName = "Shoperic";
  // Canonical origin: admin's storeUrl wins, else NEXT_PUBLIC_SITE_URL
  // (set this on the deploy platform), else built-in default.
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined;
  // Social-share image: first active HERO banner, else a bundled brand banner.
  let ogImage = "/brand/banner-sale.jpg";

  try {
    const { db } = await import("@/lib/db");
    const [s, heroBanner] = await Promise.all([
      db.siteSetting.findUnique({ where: { id: "singleton" } }),
      db.banner.findFirst({
        where: { position: "HERO", status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        select: { image: true },
      }),
    ]);
    if (s) {
      title = s.seoTitle?.trim() || `${s.siteName} — Online Shopping`;
      description = s.seoDescription?.trim() || description;
      keywords = s.seoKeywords?.trim() || undefined;
      siteName = s.siteName;
      if (s.storeUrl?.trim()) siteUrl = s.storeUrl.trim();
      if (s.faviconUrl) icons = [{ url: s.faviconUrl }];
    }
    if (heroBanner?.image) ogImage = heroBanner.image;
  } catch {
    // database unavailable — fall back to safe defaults
  }

  // Base for resolving relative metadata URLs (canonical, og:image…).
  const metadataBase = toMetadataBase(siteUrl);

  return {
    metadataBase,
    title,
    description,
    keywords,
    icons,
    // Hash-routed SPA: "/" is the single crawlable entry page (see sitemap.ts).
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogImage }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** SEO metadata is admin-controlled (Settings → SEO in the admin console). */
export async function generateMetadata(): Promise<Metadata> {
  let title = "Shoperic — Online Shopping";
  let description = "Shop electronics, fashion, home essentials and more.";
  let keywords: string | undefined;
  let icons: Metadata["icons"] = [{ url: "/brand/favicon.svg", type: "image/svg+xml" }];

  try {
    const { db } = await import("@/lib/db");
    const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (s) {
      title = s.seoTitle?.trim() || `${s.siteName} — Online Shopping`;
      description = s.seoDescription?.trim() || description;
      keywords = s.seoKeywords?.trim() || undefined;
      if (s.faviconUrl) icons = [{ url: s.faviconUrl }];
    }
  } catch {
    // database unavailable — fall back to safe defaults
  }

  return {
    title,
    description,
    keywords,
    icons,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
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

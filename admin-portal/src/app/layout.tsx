import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Revalidate branding metadata hourly so admin changes propagate.
export const revalidate = 3600;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** SEO + branding metadata is admin-controlled (Settings → Branding). */
export async function generateMetadata(): Promise<Metadata> {
  let title = "Admin Console";
  let description = "Store administration panel";
  let icons: Metadata["icons"] = [{ url: "/icon", type: "image/png" }];

  try {
    const { db } = await import("@/lib/db");
    const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (s) {
      title = `${s.siteName} — Admin Console`;
      description = `Administration panel for ${s.siteName}.`;
      if (s.faviconUrl) icons = [{ url: s.faviconUrl }];
    }
  } catch {
    // database unavailable — fall back to safe defaults
  }

  return {
    title,
    description,
    icons,
    robots: { index: false, follow: false },
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

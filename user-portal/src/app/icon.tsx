import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Runtime-generated favicon fallback. If the admin has uploaded a custom
 * favicon in Settings → Branding, the layout's `icons` metadata already points
 * to it and this route is bypassed. This route supplies a branded letter-icon
 * (colored with the site's primary color) when no custom favicon is set.
 *
 * Re-evaluated hourly so admin changes propagate without a redeploy.
 */
export const revalidate = 3600;

export default async function Icon() {
  let siteName = "S";
  let bg = "#ea580c";
  try {
    const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (s) {
      siteName = (s.siteName?.trim()?.[0] ?? "S").toUpperCase();
      bg = s.primaryColor || bg;
    }
  } catch {
    // ignore — use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 800,
          color: "#ffffff",
          background: bg,
          borderRadius: 8,
        }}
      >
        {siteName}
      </div>
    ),
    { ...size }
  );
}

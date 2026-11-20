import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Runtime-generated favicon fallback for the admin console. Mirrors the
 * storefront's branding (site name + primary color) so both portals share
 * the same visual identity.
 */
export const revalidate = 3600;

export default async function Icon() {
  let siteName = "A";
  let bg = "#ea580c";
  try {
    const s = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (s) {
      siteName = (s.siteName?.trim()?.[0] ?? "A").toUpperCase();
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

import type { NextConfig } from "next";

/**
 * Admin portal — standalone Next.js app.
 *
 * basePath logic:
 *  - On Vercel (VERCEL=1) the portal deploys to its own domain -> served from "/".
 *  - Everywhere else (local dev / the monorepo sandbox) it is reachable under
 *    "/admin" so the storefront can proxy to it (see user-portal/next.config.ts).
 */
const basePath = process.env.VERCEL ? undefined : "/admin";

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
  },
};

export default nextConfig;

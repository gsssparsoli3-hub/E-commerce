import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    // In local/sandbox development the admin portal (../admin-portal) runs on
    // port 3001; proxying /admin/* through this app makes both portals
    // previewable on a single origin. On Vercel each portal deploys to its own
    // domain, so the proxy is disabled there.
    if (process.env.VERCEL || process.env.DISABLE_ADMIN_PROXY === "1") return [];
    return [
      { source: "/admin", destination: "http://127.0.0.1:3001/admin" },
      { source: "/admin/:path*", destination: "http://127.0.0.1:3001/admin/:path*" },
    ];
  },
};

export default nextConfig;

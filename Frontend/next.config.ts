import type { NextConfig } from "next";

/**
 * The Express API stays a separate service. In dev it runs on localhost:4000;
 * in production set API_PROXY_TARGET to the deployed backend URL. REST and
 * Socket.IO traffic is proxied same-origin (mirrors the old Vite proxy setup).
 */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${API_PROXY_TARGET}/socket.io/:path*`,
      },
      // Browsers probe /favicon.ico by default; serve the existing SVG instead.
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendOrigin) return [];

    return [
      {
        source: "/v1/:path*",
        destination: `${backendOrigin}/v1/:path*`,
      },
      {
        source: "/healthz",
        destination: `${backendOrigin}/healthz`,
      },
      {
        source: "/readyz",
        destination: `${backendOrigin}/readyz`,
      },
    ];
  },
};

export default nextConfig;

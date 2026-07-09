import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
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

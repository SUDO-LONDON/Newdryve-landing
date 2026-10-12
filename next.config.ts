import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// No /v1, /healthz or /readyz rewrites: in production the landing router
// (scripts/railway-start-landing.cjs) sends every path outside the Next
// prefixes to Astro, so those rewrites were never reached. The API is served
// from its own origin (api.newdryve.com).
const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

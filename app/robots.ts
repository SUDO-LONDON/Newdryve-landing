import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

// The internal founder portal is disallowed for every crawler group (in
// addition to being auth-gated and marked noindex). Keep /ops and /ops/ in
// every group's disallow list.
const OPS_DISALLOW = ["/ops", "/ops/"];

export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Google-Extended",
    "Claude-Web",
    "anthropic-ai",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...OPS_DISALLOW],
      },
      ...aiBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: OPS_DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

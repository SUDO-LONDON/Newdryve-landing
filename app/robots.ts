import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com").replace(/\/$/, "");

// This Next app currently serves the private /ops surface. Keep its fallback
// robots route aligned with the canonical Astro marketing site's policy in
// case the deployment router or hosting topology changes later.
const NON_CONTENT_PATHS = ["/api/", "/ops", "/v1/", "/healthz", "/readyz"];

const AI_SEARCH_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

const AI_MODEL_CRAWLERS = ["GPTBot", "ClaudeBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: NON_CONTENT_PATHS,
      },
      {
        userAgent: AI_SEARCH_CRAWLERS,
        allow: "/",
        disallow: NON_CONTENT_PATHS,
      },
      {
        userAgent: AI_MODEL_CRAWLERS,
        allow: "/",
        disallow: NON_CONTENT_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}

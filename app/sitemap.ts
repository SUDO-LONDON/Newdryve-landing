import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

// NOTE: the internal /ops founder portal is deliberately excluded from the
// sitemap (it is auth-gated, noindex, and disallowed in robots.txt). Do not add
// any /ops entries here.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "en-GB": `${SITE_URL}/`,
        },
      },
    },
  ];
}

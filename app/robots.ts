import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawler categorization reflects each bot's primary publicly-documented
// purpose as of writing — search/citation crawlers (fetch content to
// answer a specific query, with attribution) are allowed; bulk
// training-data crawlers are disallowed. Bot purposes and names shift
// over time, so revisit this periodically rather than treating it as
// permanent policy.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // AI search/answer crawlers — allowed, since being cited in AI search
      // results is discoverability, not model training.
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      // AI training-data crawlers — disallowed.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "Applebot-Extended", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

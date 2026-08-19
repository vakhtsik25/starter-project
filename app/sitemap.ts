import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number; changeFrequency: "hourly" | "daily" | "weekly" }[] = [
    { path: "", priority: 1, changeFrequency: "hourly" },
    { path: "/stocks", priority: 0.8, changeFrequency: "daily" },
    { path: "/screener", priority: 0.8, changeFrequency: "daily" },
    { path: "/earnings-calendar", priority: 0.7, changeFrequency: "daily" },
    { path: "/compare", priority: 0.6, changeFrequency: "weekly" },
    { path: "/portfolio", priority: 0.5, changeFrequency: "weekly" },
    { path: "/early-access", priority: 0.7, changeFrequency: "weekly" },
  ];

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const companyEntries: MetadataRoute.Sitemap = STOCK_UNIVERSE.map((entry) => ({
    url: `${SITE_URL}/company/${entry.ticker}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticEntries, ...companyEntries];
}

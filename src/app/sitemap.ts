import type { MetadataRoute } from "next";
import { getMeta } from "@/lib/crime-snapshot";
import { publicEnv } from "@/lib/public-env";

const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "monthly" },
  { path: "/map", priority: 0.9, changeFrequency: "monthly" },
  { path: "/stats", priority: 0.9, changeFrequency: "monthly" },
  { path: "/community-map", priority: 0.7, changeFrequency: "daily" },
  { path: "/report", priority: 0.8, changeFrequency: "yearly" },
  { path: "/education", priority: 0.6, changeFrequency: "yearly" },
  { path: "/data-sources", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const dataModified = new Date(getMeta().generatedAt);
  return PAGES.map((page) => ({
    url: `${publicEnv.siteUrl}${page.path}`,
    lastModified: ["", "/map", "/stats", "/data-sources"].includes(page.path) ? dataModified : undefined,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

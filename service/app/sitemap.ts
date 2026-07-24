import type { MetadataRoute } from "next";
import {
  getSiteOrigin,
  isIndexableProductionSite,
} from "../utils/siteSeo.mjs";

const CANONICAL_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/product/top50/free-top", changeFrequency: "daily", priority: 0.9 },
  { path: "/product/top50/paid-top", changeFrequency: "daily", priority: 0.85 },
  { path: "/product/free/normal", changeFrequency: "daily", priority: 0.9 },
  { path: "/product/paid", changeFrequency: "daily", priority: 0.9 },
  { path: "/websochat", changeFrequency: "weekly", priority: 0.7 },
] satisfies Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableProductionSite()) return [];

  const siteOrigin = getSiteOrigin();

  return CANONICAL_ROUTES.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

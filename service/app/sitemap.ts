import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_WWW_SERVER_URI || "https://www.likenovel.net";

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

const getSiteOrigin = () => SITE_URL.replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const siteOrigin = getSiteOrigin();

  return CANONICAL_ROUTES.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

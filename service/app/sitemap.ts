import type { MetadataRoute } from "next";
import {
  getApiOrigin,
  getSiteOrigin,
  isIndexableProductionSite,
} from "../utils/siteSeo.mjs";

export const revalidate = 3600;

const CANONICAL_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/product/top50/free-top", changeFrequency: "daily", priority: 0.9 },
  { path: "/product/top50/paid-top", changeFrequency: "daily", priority: 0.85 },
  { path: "/product/free/normal", changeFrequency: "daily", priority: 0.9 },
  { path: "/product/paid", changeFrequency: "daily", priority: 0.9 },
  { path: "/product/character-chat", changeFrequency: "daily", priority: 0.8 },
  { path: "/websochat", changeFrequency: "weekly", priority: 0.7 },
] satisfies Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

interface ProductSitemapEntry {
  productId?: unknown;
  lastModified?: unknown;
}

interface ProductSitemapResponse {
  data?: ProductSitemapEntry[];
}

const getStaticEntries = (siteOrigin: string): MetadataRoute.Sitemap =>
  CANONICAL_ROUTES.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

const getProductEntries = async (
  siteOrigin: string,
): Promise<MetadataRoute.Sitemap> => {
  try {
    const response = await fetch(`${getApiOrigin()}/v1/query/products/sitemap`, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate,
      },
    });
    if (!response.ok) {
      throw new Error(`backend returned ${response.status}`);
    }

    const payload = (await response.json()) as ProductSitemapResponse;
    const seenProductIds = new Set<number>();

    return (payload.data ?? []).flatMap((entry) => {
      const productId = entry.productId;
      if (
        typeof productId !== "number" ||
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        seenProductIds.has(productId)
      ) {
        return [];
      }
      seenProductIds.add(productId);

      const parsedLastModified =
        typeof entry.lastModified === "string"
          ? new Date(entry.lastModified)
          : null;
      const lastModified =
        parsedLastModified && !Number.isNaN(parsedLastModified.getTime())
          ? parsedLastModified
          : undefined;

      return [
        {
          url: `${siteOrigin}/product/${productId}`,
          ...(lastModified ? { lastModified } : {}),
        },
      ];
    });
  } catch (error) {
    console.error("[sitemap] Failed to load product entries", error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexableProductionSite()) return [];

  const siteOrigin = getSiteOrigin();
  const productEntries = await getProductEntries(siteOrigin);
  return [...getStaticEntries(siteOrigin), ...productEntries];
}

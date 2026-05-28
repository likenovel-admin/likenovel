import type { MarketingAttribution } from "./marketingAttribution";
import type { ProductDetailEntrySource } from "./productPath";

export type ProductEntrySourceGroup =
  | "social"
  | "recommend_slot"
  | "search"
  | "ranking"
  | "direct"
  | "other";

export type ProductEntryAttribution = {
  productId: number;
  entrySource: string;
  entrySourceGroup: ProductEntrySourceGroup;
};

export type ResolveProductEntryAttributionInput = {
  pathname: string;
  referrerPath?: string | null;
  entrySource?: ProductDetailEntrySource | string | null;
  marketingAttribution?: MarketingAttribution | null;
};

const socialGroups = new Set(["instagram", "x", "twitter", "threads"]);

function parseProductDetailId(pathname: string): number | null {
  const match = /^\/product\/([1-9]\d*)$/.exec(pathname.split("?")[0].split("#")[0] || "");
  if (!match) {
    return null;
  }

  const productId = Number(match[1]);
  return Number.isSafeInteger(productId) ? productId : null;
}

function normalizeSource(value: string | null | undefined): string | null {
  const normalized = (value || "").trim().toLowerCase();
  return normalized || null;
}

function isSearchEntry(entrySource: string | null, referrerPath: string | null): boolean {
  return (
    entrySource?.startsWith("search_") === true ||
    referrerPath?.startsWith("/product/search") === true
  );
}

function isRankingEntry(entrySource: string | null, referrerPath: string | null): boolean {
  return (
    entrySource?.startsWith("top50_") === true ||
    referrerPath?.startsWith("/product/top50") === true
  );
}

function resolveSocialEntrySource(attribution: MarketingAttribution | null | undefined) {
  const utmSource = normalizeSource(attribution?.utmSource);
  const referrerGroup = normalizeSource(attribution?.externalReferrerGroup);

  if (
    normalizeSource(attribution?.utmMedium) === "social" ||
    (utmSource && socialGroups.has(utmSource)) ||
    (referrerGroup && socialGroups.has(referrerGroup))
  ) {
    return utmSource || referrerGroup || "social";
  }

  return null;
}

export function resolveProductEntryAttribution(
  input: ResolveProductEntryAttributionInput
): ProductEntryAttribution | null {
  const productId = parseProductDetailId(input.pathname);
  if (!productId) {
    return null;
  }

  const socialSource = resolveSocialEntrySource(input.marketingAttribution);
  if (socialSource) {
    return {
      productId,
      entrySource: socialSource,
      entrySourceGroup: "social",
    };
  }

  const entrySource = normalizeSource(input.entrySource);
  const referrerPath = input.referrerPath || null;

  if (isSearchEntry(entrySource, referrerPath)) {
    return {
      productId,
      entrySource: entrySource || "search",
      entrySourceGroup: "search",
    };
  }

  if (isRankingEntry(entrySource, referrerPath)) {
    return {
      productId,
      entrySource: entrySource || "ranking",
      entrySourceGroup: "ranking",
    };
  }

  if (entrySource) {
    return {
      productId,
      entrySource,
      entrySourceGroup: "recommend_slot",
    };
  }

  if (!referrerPath) {
    return {
      productId,
      entrySource: "direct",
      entrySourceGroup: "direct",
    };
  }

  return {
    productId,
    entrySource: "other",
    entrySourceGroup: "other",
  };
}

export function resolveProductDetailSignalEntrySource(
  entrySource: string | null | undefined,
  productEntryAttribution: ProductEntryAttribution | null | undefined
): string | null {
  return productEntryAttribution?.entrySource || normalizeSource(entrySource);
}

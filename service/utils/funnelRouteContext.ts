import type { ReadonlyURLSearchParams } from "next/navigation";

export type FunnelTrackedPageType = "product_detail" | "viewer" | "other";

export interface FunnelRouteContext {
  rawFullPath: string;
  fullPath: string;
  pathname: string;
  rawSearch: string;
  search: string;
  pageType: FunnelTrackedPageType;
  productId?: number;
  viewerEpisodeId?: number;
  viewerKind?: "episode" | "notice";
  viewerHintProductId?: number;
  changedAt: number;
}

const PRODUCT_DETAIL_PATH_REGEX = /^\/product\/(\d+)$/;
const VIEWER_PATH_REGEX = /^\/viewer\/(\d+)$/;
const VIEWER_INTERNAL_QUERY_KEYS = ["lnr", "productId", "title", "type", "entrySource"];

const normalizePositiveInt = (value?: number | string | null) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
};

export const calculateProductDetailActiveSeconds = (
  sourceChangedAt: number,
  evaluatedAt: number,
  frozenActiveSeconds?: number
) => {
  if (Number.isFinite(frozenActiveSeconds)) {
    return Math.max(0, Math.floor(frozenActiveSeconds as number));
  }
  if (!Number.isFinite(sourceChangedAt) || !Number.isFinite(evaluatedAt)) {
    return 0;
  }
  return Math.max(0, Math.floor((evaluatedAt - sourceChangedAt) / 1000));
};

export const createFunnelRouteContext = (
  pathname: string,
  searchParams?: URLSearchParams | ReadonlyURLSearchParams
): FunnelRouteContext => {
  const rawSearchString = searchParams?.toString() || "";
  const rawSearch = rawSearchString ? `?${rawSearchString}` : "";
  const rawFullPath = `${pathname}${rawSearch}`;
  const changedAt = Date.now();

  const productMatch = pathname.match(PRODUCT_DETAIL_PATH_REGEX);
  if (productMatch) {
    return {
      rawFullPath,
      fullPath: pathname,
      pathname,
      rawSearch,
      search: "",
      pageType: "product_detail",
      productId: normalizePositiveInt(productMatch[1]),
      changedAt,
    };
  }

  const viewerMatch = pathname.match(VIEWER_PATH_REGEX);
  if (viewerMatch) {
    const viewerEpisodeId = normalizePositiveInt(viewerMatch[1]);
    const viewerKind = searchParams?.get("type") === "notice" ? "notice" : "episode";
    const viewerHintProductId = normalizePositiveInt(
      searchParams?.get("productId")
    );
    const normalizedViewerSearchParams = new URLSearchParams(
      searchParams?.toString() || ""
    );
    VIEWER_INTERNAL_QUERY_KEYS.forEach((key) =>
      normalizedViewerSearchParams.delete(key)
    );
    const normalizedViewerSearchString = normalizedViewerSearchParams.toString();
    const search = normalizedViewerSearchString
      ? `?${normalizedViewerSearchString}`
      : "";

    return {
      rawFullPath,
      fullPath: `${pathname}${search}`,
      pathname,
      rawSearch,
      search,
      pageType: "viewer",
      viewerEpisodeId,
      viewerKind,
      viewerHintProductId,
      changedAt,
    };
  }

  return {
    rawFullPath,
    fullPath: rawFullPath,
    pathname,
    rawSearch,
    search: rawSearch,
    pageType: "other",
    changedAt,
  };
};

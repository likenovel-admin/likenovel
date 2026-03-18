interface BuildViewerPathOptions {
  productId?: number | string | null;
  type?: string | null;
  title?: string | null;
}

const normalizeProductId = (productId?: number | string | null) => {
  if (typeof productId === "number") {
    return Number.isFinite(productId) && productId > 0
      ? String(productId)
      : null;
  }

  if (typeof productId === "string") {
    const trimmed = productId.trim();
    return trimmed ? trimmed : null;
  }

  return null;
};

export const buildViewerPath = (
  episodeId: number | string,
  options?: BuildViewerPathOptions
) => {
  const searchParams = new URLSearchParams();
  const normalizedProductId = normalizeProductId(options?.productId);

  if (normalizedProductId) {
    searchParams.set("productId", normalizedProductId);
  }

  if (options?.type) {
    searchParams.set("type", options.type);
  }

  if (options?.title) {
    searchParams.set("title", options.title);
  }

  const queryString = searchParams.toString();
  return queryString
    ? `/viewer/${episodeId}?${queryString}`
    : `/viewer/${episodeId}`;
};

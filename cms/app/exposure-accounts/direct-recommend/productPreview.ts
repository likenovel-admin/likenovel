export interface DirectRecommendProductSummary {
  product_id: number;
  title?: string | null;
  author_nickname?: string | null;
  count_episode?: number | null;
  last_episode_date?: string | null;
}

export interface DirectRecommendProductPreviewRow {
  productId: number;
  title: string | null;
  authorNickname: string | null;
  countEpisode: number | null;
  lastEpisodeDate: string | null;
  found: boolean;
}

export function appendDirectRecommendProductId(
  currentProductIds: number[],
  productId: number
): string {
  const nextProductIds = currentProductIds.includes(productId)
    ? currentProductIds
    : [...currentProductIds, productId];

  return nextProductIds.join(",");
}

export function removeDirectRecommendProductId(
  currentProductIds: number[],
  productId: number
): string {
  return currentProductIds
    .filter((currentProductId) => currentProductId !== productId)
    .join(",");
}

export function buildDirectRecommendProductPreviewRows(
  productIds: number[],
  products: DirectRecommendProductSummary[]
): DirectRecommendProductPreviewRow[] {
  const productById = new Map(
    products.map((product) => [Number(product.product_id), product])
  );

  return productIds.map((productId) => {
    const product = productById.get(productId);

    return {
      productId,
      title: product?.title ?? null,
      authorNickname: product?.author_nickname ?? null,
      countEpisode: product?.count_episode ?? null,
      lastEpisodeDate: product?.last_episode_date ?? null,
      found: Boolean(product),
    };
  });
}

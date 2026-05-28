export const PRODUCT_DETAIL_ENTRY_SOURCE = {
  HOME_FREE_TOP: "home_free_top",
  HOME_PAID_TOP: "home_paid_top",
  HOME_RECENTLY_VIEWED: "home_recently_viewed",
  HOME_RECENT_BASED_RECOMMEND: "home_recent_based_recommend",
  AI_TASTE_SECTION: "ai_taste_section",
  AI_CHAT_RECOMMEND: "ai_chat_recommend",
  SEARCH_MOST_SEARCHED: "search_most_searched",
  SEARCH_RECOMMEND: "search_recommend",
  SEARCH_RESULT: "search_result",
  PREFERENCE_BOOKMARK: "preference_bookmark",
  PREFERENCE_INTEREST_DROP: "preference_interest_drop",
  PREFERENCE_LAST_VIEWED: "preference_last_viewed",
  FREE_NORMAL_LIST: "free_normal_list",
  FREE_NORMAL_BOX: "free_normal_box",
  FREE_FREE_LIST: "free_free_list",
  FREE_FREE_BOX: "free_free_box",
  PAID_ONGOING_LIST: "paid_ongoing_list",
  PAID_ONGOING_BOX: "paid_ongoing_box",
  PAID_END_LIST: "paid_end_list",
  PAID_END_BOX: "paid_end_box",
  PAID_STANDALONE_LIST: "paid_standalone_list",
  PAID_STANDALONE_BOX: "paid_standalone_box",
  TOP50_FREE: "top50_free",
  TOP50_PAID: "top50_paid",
  REVIEW_PRODUCT: "review_product",
  EVENT_PRODUCT: "event_product",
  HOME_INTEREST_DROP_CARD: "home_interest_drop_card",
  HOME_CP_PROMOTION: "home_cp_promotion",
  PAID_CP_PROMOTION: "paid_cp_promotion",
  FLOATING_RECENT_VIEWED: "floating_recent_viewed",
  PAID_PROMOTION: "paid_promotion",
  HOME_BOTTOM_SUGGEST: "home_bottom_suggest",
  HOME_BOTTOM_INTEREST: "home_bottom_interest",
  PRODUCT_DETAIL_CONTENT_SUGGEST: "product_detail_content_suggest",
  PRODUCT_DETAIL_CART_SUGGEST: "product_detail_cart_suggest",
  PRODUCT_DETAIL_SAME_AUTHOR: "product_detail_same_author",
  VIEWER_RECOMMENDED: "viewer_recommended",
} as const;

export type ProductDetailEntrySource =
  (typeof PRODUCT_DETAIL_ENTRY_SOURCE)[keyof typeof PRODUCT_DETAIL_ENTRY_SOURCE];

export interface ProductDetailEntrySourceState {
  productId: number | null;
  entrySource: ProductDetailEntrySource | null;
}

interface BuildProductDetailPathOptions {
  entrySource?: string | null;
}

const PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_KEY =
  "pending_product_detail_entry_source";
const PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_TTL_MS = 10 * 1000;
const MARKETING_UTM_KEYS = [
  "lns",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export const PRODUCT_DETAIL_MARKETING_BACK_FALLBACK_PATH = "/";

const PRODUCT_DETAIL_ENTRY_SOURCE_SET = new Set<ProductDetailEntrySource>(
  Object.values(PRODUCT_DETAIL_ENTRY_SOURCE)
);

export const buildProductDetailPath = (
  productId: number,
  options?: BuildProductDetailPathOptions
) => {
  const searchParams = new URLSearchParams();
  const entrySource = options?.entrySource?.trim();

  if (entrySource) {
    searchParams.set("entrySource", entrySource);
  }

  const queryString = searchParams.toString();
  return queryString
    ? `/product/${productId}?${queryString}`
    : `/product/${productId}`;
};

export const getProductDetailMarketingBackFallbackPath = (
  search: string | null | undefined,
  hasHiddenMarketingLanding: boolean = false
): string | null => {
  const queryString = (search || "").startsWith("?")
    ? (search || "").slice(1)
    : search || "";
  const params = new URLSearchParams(queryString);
  const hasMarketingSignal = MARKETING_UTM_KEYS.some(
    (key) => (params.get(key) || "").trim().length > 0
  );

  return hasMarketingSignal || hasHiddenMarketingLanding
    ? PRODUCT_DETAIL_MARKETING_BACK_FALLBACK_PATH
    : null;
};

export const getProductDetailEntrySource = (
  value: string | null
): ProductDetailEntrySource | null => {
  if (!value || !PRODUCT_DETAIL_ENTRY_SOURCE_SET.has(value as ProductDetailEntrySource)) {
    return null;
  }

  return value as ProductDetailEntrySource;
};

export const getEffectiveProductDetailEntrySource = (
  urlEntrySource: ProductDetailEntrySource | null,
  state: ProductDetailEntrySourceState,
  productId: number
): ProductDetailEntrySource | null => {
  if (urlEntrySource) {
    return urlEntrySource;
  }

  return state.productId === productId ? state.entrySource : null;
};

export const resolveProductDetailEntrySourceState = (
  current: ProductDetailEntrySourceState,
  productId: number,
  consumedEntrySource: ProductDetailEntrySource | null
): ProductDetailEntrySourceState => {
  if (consumedEntrySource) {
    return { productId, entrySource: consumedEntrySource };
  }

  if (current.productId === productId) {
    return current;
  }

  return { productId, entrySource: null };
};

export const isProductDetailEntrySourceResolvedForProduct = (
  state: ProductDetailEntrySourceState,
  productId: number
) => state.productId === productId;

export const shouldPersistProductDetailEntrySourceForRecharge = (
  originPageType: string | null | undefined,
  entrySource: ProductDetailEntrySource | null
): entrySource is ProductDetailEntrySource =>
  originPageType === "product_detail" && !!entrySource;

export const setPendingProductDetailEntrySource = (
  productId: number,
  entrySource: ProductDetailEntrySource,
  ttlMs: number = PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_TTL_MS
) => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_KEY,
    JSON.stringify({
      productId,
      entrySource,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    })
  );
};

export const consumePendingProductDetailEntrySource = (
  productId: number
): ProductDetailEntrySource | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      productId?: number;
      entrySource?: string;
      timestamp?: number;
      expiresAt?: number;
    };

    sessionStorage.removeItem(PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_KEY);

    const expiresAt =
      typeof parsed.expiresAt === "number"
        ? parsed.expiresAt
        : (parsed.timestamp ?? 0) + PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_TTL_MS;

    if (
      parsed.productId !== productId ||
      typeof parsed.timestamp !== "number" ||
      Date.now() > expiresAt
    ) {
      return null;
    }

    return getProductDetailEntrySource(parsed.entrySource ?? null);
  } catch (error) {
    console.error(
      "[productPath] failed to consume pending product detail entry source",
      error
    );
    sessionStorage.removeItem(PENDING_PRODUCT_DETAIL_ENTRY_SOURCE_KEY);
    return null;
  }
};

export const consumeProductDetailEntrySource = (
  productId: number,
  urlEntrySource: ProductDetailEntrySource | null
): ProductDetailEntrySource | null => {
  const pendingEntrySource = consumePendingProductDetailEntrySource(productId);
  return urlEntrySource ?? pendingEntrySource;
};

import assert from "node:assert/strict";
import {
  buildProductDetailPath,
  getProductDetailEntrySource,
  getEffectiveProductDetailEntrySource,
  getProductDetailMarketingBackFallbackPath,
  consumeProductDetailEntrySource,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  PRODUCT_DETAIL_MARKETING_BACK_FALLBACK_PATH,
  consumePendingProductDetailEntrySource,
  isProductDetailEntrySourceResolvedForProduct,
  resolveProductDetailEntrySourceState,
  setPendingProductDetailEntrySource,
  shouldPersistProductDetailEntrySourceForRecharge,
} from "./productPath.ts";

assert.equal(
  buildProductDetailPath(634, {
    entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  }),
  "/product/634?entrySource=ai_taste_section",
  "product detail URL should carry entry source when provided"
);

assert.equal(
  buildProductDetailPath(634, {
    entrySource: "  ",
  }),
  "/product/634",
  "blank entry source should not create a query parameter"
);

assert.equal(
  getProductDetailMarketingBackFallbackPath(
    "?utm_source=instagram&utm_medium=social&utm_campaign=p1109_card&utm_content=card01"
  ),
  PRODUCT_DETAIL_MARKETING_BACK_FALLBACK_PATH,
  "marketing product landings should use an internal back fallback"
);

assert.equal(
  getProductDetailMarketingBackFallbackPath("entrySource=ai_taste_section"),
  null,
  "internal entry source links should not override normal product back behavior"
);

assert.equal(
  getProductDetailMarketingBackFallbackPath("?utm_source=   "),
  null,
  "blank marketing query values should not seed an internal back fallback"
);

assert.equal(
  getProductDetailEntrySource(
    new URLSearchParams("entrySource=ai_taste_section").get("entrySource")
  ),
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  "product detail page should be able to resolve entry source from URL"
);

assert.equal(
  getEffectiveProductDetailEntrySource(
    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
    { productId: 634, entrySource: null },
    634
  ),
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  "URL entry source should be available before the effect-backed state updates"
);

assert.equal(
  getEffectiveProductDetailEntrySource(
    null,
    { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    634
  ),
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  "state entry source should remain the fallback when the URL has no source"
);

assert.equal(
  getEffectiveProductDetailEntrySource(
    null,
    { productId: 633, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    634
  ),
  null,
  "state entry source from another product must not leak into the current product"
);

assert.deepEqual(
  resolveProductDetailEntrySourceState(
    { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    634,
    null
  ),
  { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
  "same product should preserve an already consumed entry source"
);

assert.deepEqual(
  resolveProductDetailEntrySourceState(
    { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    635,
    null
  ),
  { productId: 635, entrySource: null },
  "different product without a pending source must clear stale attribution"
);

assert.deepEqual(
  resolveProductDetailEntrySourceState(
    { productId: 634, entrySource: null },
    635,
    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
  ),
  { productId: 635, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
  "new pending source should win for the current product"
);

assert.equal(
  isProductDetailEntrySourceResolvedForProduct(
    { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    634
  ),
  true,
  "entry source is resolved only for the current product"
);

assert.equal(
  isProductDetailEntrySourceResolvedForProduct(
    { productId: 634, entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION },
    635
  ),
  false,
  "entry source resolved for a previous product must not unlock current product signals"
);

assert.equal(
  shouldPersistProductDetailEntrySourceForRecharge(
    "product_detail",
    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
  ),
  true,
  "product detail recharge should preserve attribution through the payment round trip"
);

assert.equal(
  shouldPersistProductDetailEntrySourceForRecharge(
    "viewer",
    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
  ),
  false,
  "viewer recharge must not leave stale product detail attribution behind"
);

assert.equal(
  shouldPersistProductDetailEntrySourceForRecharge("product_detail", null),
  false,
  "missing entry source should not create a pending attribution record"
);

const originalWindow = globalThis.window;
const originalSessionStorage = globalThis.sessionStorage;
const originalDateNow = Date.now;
const storage = new Map<string, string>();

Object.defineProperty(globalThis, "window", {
  value: {},
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
  configurable: true,
});

Date.now = () => 1_000;
setPendingProductDetailEntrySource(
  634,
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  60_000
);

Date.now = () => 31_000;
assert.equal(
  consumePendingProductDetailEntrySource(634),
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  "custom pending TTL should preserve attribution through recharge round trips"
);

Date.now = () => 41_000;
setPendingProductDetailEntrySource(
  634,
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  60_000
);

Date.now = () => 42_000;
assert.equal(
  consumeProductDetailEntrySource(
    634,
    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
  ),
  PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
  "URL entry source should win while clearing the pending source"
);

assert.equal(
  consumePendingProductDetailEntrySource(634),
  null,
  "pending entry source should not leak after a URL-backed product detail view"
);

Date.now = originalDateNow;
Object.defineProperty(globalThis, "window", {
  value: originalWindow,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: originalSessionStorage,
  configurable: true,
});

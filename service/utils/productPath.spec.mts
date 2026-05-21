import assert from "node:assert/strict";
import {
  PRODUCT_DETAIL_ENTRY_SOURCE,
  consumePendingProductDetailEntrySource,
  isProductDetailEntrySourceResolvedForProduct,
  resolveProductDetailEntrySourceState,
  setPendingProductDetailEntrySource,
  shouldPersistProductDetailEntrySourceForRecharge,
} from "./productPath.ts";

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

Date.now = originalDateNow;
Object.defineProperty(globalThis, "window", {
  value: originalWindow,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: originalSessionStorage,
  configurable: true,
});

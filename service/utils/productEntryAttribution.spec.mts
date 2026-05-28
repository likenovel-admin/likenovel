import assert from "node:assert/strict";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "./productPath.ts";
import {
  resolveProductDetailSignalEntrySource,
  resolveProductEntryAttribution,
} from "./productEntryAttribution.ts";

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1117",
    referrerPath: null,
    entrySource: null,
    marketingAttribution: {
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "p1117_card",
      utmContent: "card01",
      externalReferrerHost: null,
      externalReferrerGroup: "instagram",
    },
  });

  assert.deepEqual(
    result,
    {
      productId: 1117,
      entrySource: "instagram",
      entrySourceGroup: "social",
    },
    "short social tracking links should become social product entry attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1126",
    referrerPath: null,
    entrySource: null,
    marketingAttribution: {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      externalReferrerHost: "t.co",
      externalReferrerGroup: "x",
    },
  });

  assert.deepEqual(
    result,
    {
      productId: 1126,
      entrySource: "x",
      entrySourceGroup: "social",
    },
    "x referrer-only landings should still become social product entry attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1117",
    referrerPath: "/product/search/result/normal",
    entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_RESULT,
    marketingAttribution: null,
  });

  assert.deepEqual(
    result,
    {
      productId: 1117,
      entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_RESULT,
      entrySourceGroup: "search",
    },
    "search product links should become search attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1117",
    referrerPath: "/product/top50/free",
    entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_FREE,
    marketingAttribution: null,
  });

  assert.deepEqual(
    result,
    {
      productId: 1117,
      entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_FREE,
      entrySourceGroup: "ranking",
    },
    "top50 product links should become ranking attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1117",
    referrerPath: "/",
    entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP,
    marketingAttribution: null,
  });

  assert.deepEqual(
    result,
    {
      productId: 1117,
      entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP,
      entrySourceGroup: "recommend_slot",
    },
    "home slot product links should become recommendation slot attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/product/1117",
    referrerPath: null,
    entrySource: null,
    marketingAttribution: null,
  });

  assert.deepEqual(
    result,
    {
      productId: 1117,
      entrySource: "direct",
      entrySourceGroup: "direct",
    },
    "plain product landings without referrer should become direct attribution"
  );
}

{
  const result = resolveProductEntryAttribution({
    pathname: "/viewer/123",
    referrerPath: "/product/1117",
    entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP,
    marketingAttribution: null,
  });

  assert.equal(result, null, "non product-detail routes should not create product attribution");
}

{
  assert.equal(
    resolveProductDetailSignalEntrySource(
      null,
      {
        productId: 1117,
        entrySource: "instagram",
        entrySourceGroup: "social",
      }
    ),
    "instagram",
    "product detail signal should reuse social attribution when URL entry source is absent"
  );

  assert.equal(
    resolveProductDetailSignalEntrySource(
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP,
      {
        productId: 1117,
        entrySource: "instagram",
        entrySourceGroup: "social",
      }
    ),
    "instagram",
    "marketing attribution should win over internal source for external campaign landings"
  );

  assert.equal(
    resolveProductDetailSignalEntrySource(PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP, null),
    PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP,
    "internal source should remain the signal source without marketing attribution"
  );
}

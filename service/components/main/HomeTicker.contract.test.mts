import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL("./HomeTicker.tsx", import.meta.url),
  "utf8"
);
const dtoSource = readFileSync(
  new URL("../../app/api/query/product/dto.ts", import.meta.url),
  "utf8"
);
const apiSource = readFileSync(
  new URL("../../app/api/query/product/index.ts", import.meta.url),
  "utf8"
);
const productPathSource = readFileSync(
  new URL("../../utils/productPath.ts", import.meta.url),
  "utf8"
);

const hookStart = apiSource.indexOf("export const useGetHomeTicker");
const hookEnd = apiSource.indexOf("export const useGetMainSingleSlots", hookStart);
assert.notEqual(hookStart, -1, "product API should export useGetHomeTicker");
assert.notEqual(hookEnd, -1, "useGetHomeTicker should be placed before main single slots");
const hookSource = apiSource.slice(hookStart, hookEnd);

assert.match(
  dtoSource,
  /export type HomeTickerFreshness =[\s\S]*"weekly"[\s\S]*"near_real_time"[\s\S]*"ranking_snapshot"[\s\S]*"metric_snapshot"[\s\S]*"trend_snapshot"[\s\S]*"fallback"/,
  "Home ticker DTO should expose the backend freshness enum"
);
assert.match(
  dtoSource,
  /export interface IHomeTickerItem[\s\S]*type: string;[\s\S]*message: string;[\s\S]*productId: number \| null;[\s\S]*priority: number;[\s\S]*freshness: HomeTickerFreshness;/,
  "Home ticker item DTO should match the backend item shape"
);
assert.match(
  dtoSource,
  /export interface IGetHomeTickerResponse[\s\S]*asOf: string;[\s\S]*refreshAfterSeconds: number;[\s\S]*rotateEveryMs: number;[\s\S]*items: IHomeTickerItem\[\];/,
  "Home ticker response DTO should be top-level, not wrapped in data"
);
assert.match(
  hookSource,
  /\/v1\/query\/products\/home-ticker\?adult_yn=\$\{adultYnParam\}/,
  "useGetHomeTicker should call the home ticker endpoint"
);
assert.match(
  hookSource,
  /queryKey:\s*\["getHomeTicker",\s*adultYnParam,\s*cacheIdentity\]/,
  "useGetHomeTicker query key should include adult_yn and cache identity"
);
assert.match(
  hookSource,
  /return response\.data;/,
  "useGetHomeTicker should return the top-level response body"
);
assert.doesNotMatch(
  hookSource,
  /response\.data\.data/,
  "useGetHomeTicker must not expect a { data: ... } wrapper"
);
assert.match(
  hookSource,
  /staleTime:\s*HOME_TICKER_STALE_TIME_MS/,
  "useGetHomeTicker should use the dedicated 60 second stale time"
);
assert.match(
  hookSource,
  /refetchInterval:\s*HOME_TICKER_STALE_TIME_MS/,
  "useGetHomeTicker should refresh the open home surface every 60 seconds"
);

assert.match(
  componentSource,
  /오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다\./,
  "HomeTicker should include the required fallback copy"
);
assert.match(
  componentSource,
  /HOME_TICKER_BLOCKED_TERMS = \["연독률", "재유입", "전환율"\]/,
  "HomeTicker should guard internal metric terms before display"
);
assert.match(
  componentSource,
  /hasBlockedTerm\(message\)[\s\S]*return null;/,
  "HomeTicker should remove a message that contains an internal metric term"
);
assert.match(
  componentSource,
  /\.map\(normalizeTickerItem\)[\s\S]*\.filter\(\(item\): item is IHomeTickerItem => item !== null\)[\s\S]*normalizedItems\.length > 0 \? normalizedItems : \[fallbackItem\]/,
  "HomeTicker should fallback only when no safe ticker items remain"
);
assert.match(
  componentSource,
  /Math\.max\([\s\S]*rotateEveryMs \|\| HOME_TICKER_DEFAULT_ROTATE_EVERY_MS,[\s\S]*HOME_TICKER_MIN_ROTATE_EVERY_MS[\s\S]*\)/,
  "HomeTicker interval should floor fast rotations"
);
assert.match(
  componentSource,
  /prefersReducedMotion \|\| displayItems\.length <= 1/,
  "HomeTicker should not start rolling for reduced motion users"
);
assert.match(
  componentSource,
  /setPendingProductDetailEntrySource\([\s\S]*PRODUCT_DETAIL_ENTRY_SOURCE\.HOME_TICKER[\s\S]*router\.push\(buildProductDetailPath\(activeItem\.productId\)\)/,
  "HomeTicker clicks should seed home_ticker attribution before navigation"
);
assert.match(
  componentSource,
  /data-home-ticker/,
  "HomeTicker should expose a stable placement marker"
);
assert.match(
  productPathSource,
  /HOME_TICKER: "home_ticker"/,
  "productPath should expose HOME_TICKER entry source"
);

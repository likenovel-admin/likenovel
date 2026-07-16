import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serverPageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8"
);
const source = readFileSync(
  new URL("./ProductDetailClient.tsx", import.meta.url),
  "utf8"
);
const commentQuerySource = readFileSync(
  new URL("../../api/query/comment/index.ts", import.meta.url),
  "utf8"
);
const authorProductQuerySource = readFileSync(
  new URL("../../api/query/author/product/index.ts", import.meta.url),
  "utf8"
);
const productQuerySource = readFileSync(
  new URL("../../api/query/product/index.ts", import.meta.url),
  "utf8"
);
const commentAreaSource = readFileSync(
  new URL("../../../components/common/CommentArea.tsx", import.meta.url),
  "utf8"
);
const productCoverAreaSource = readFileSync(
  new URL("../../../components/productDetail/ProductCoverArea.tsx", import.meta.url),
  "utf8"
);

assert.doesNotMatch(
  serverPageSource,
  /^"use client";/,
  "product detail route should remain a server component"
);
assert.match(
  serverPageSource,
  /\/v1\/query\/products\/\$\{productId\}\/detail-shell/,
  "product detail route should fetch the public render shell before hydration"
);
assert.match(
  serverPageSource,
  /cache:\s*"no-store"/,
  "public render shell must not leak stale private visibility through a shared cache"
);
assert.match(
  serverPageSource,
  /initialProduct=\{initialProduct\}/,
  "server-rendered product data should be passed to the client detail surface"
);
assert.match(
  serverPageSource,
  /initialSearchParamString=\{initialSearchParamString\}/,
  "server-rendered product detail should pass query state without a client rendering bailout"
);
assert.doesNotMatch(
  serverPageSource,
  /Authorization|cookies\(|headers\(/,
  "public render shell must not forward authenticated user state"
);
assert.match(
  source,
  /initialProduct:\s*IProduct \| null/,
  "product detail client should accept the public server-rendered product"
);
assert.match(
  source,
  /data\?\.data\.product \?\? initialProduct/,
  "authenticated product detail should replace the public render shell when ready"
);
assert.doesNotMatch(
  source,
  /useSearchParams/,
  "product detail should not opt the server-rendered cover into client-only rendering"
);
assert.match(
  productCoverAreaSource,
  /fetchPriority="high"/,
  "the above-the-fold cover should request high browser priority"
);

assert.match(source, /const aiLibrarianBrief = aiBriefsData\?\.data\?\.\[0\] \?\? null/);
assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);
assert.match(source, /openAiLibrarianPanel/);
assert.doesNotMatch(source, /openAiLibrarianPanelOrLogin/);
assert.match(source, /requestProductQuestion/);
assert.match(source, /openAiLibrarianPanel\(\{[\s\S]*setIsOpen: setAiLibrarianPanelOpen/);
assert.match(source, /const productQuestion = \{/);
assert.doesNotMatch(source, /pendingProductQuestion: productQuestion/);
assert.doesNotMatch(source, /if \(!shouldAskAiLibrarian\) return/);
assert.match(source, /requestProductQuestion\(productQuestion\)/);
assert.match(source, /이 작품 어떤 작품인지 알려줘/);
assert.match(source, /onAskMore=\{handleAskAiLibrarianMore\}/);
assert.doesNotMatch(source, /router\.push\(["']\/websochat/);
assert.match(
  source,
  /const shouldLoadSecondaryProductDetailData =\s*shouldPrioritizeAiLibrarian \|\| \(isSuccess && hasDeferredProductDetailSecondaryData\);/,
  "Product detail should defer below-fold secondary data after the first render"
);
assert.match(
  source,
  /useSelectSuggestProducts\(\s*productId,\s*"content",\s*shouldLoadSecondaryProductDetailData\s*\)/,
  "Content suggestions should not compete with the first product-detail render"
);
assert.match(
  source,
  /useSelectAuthorProducts\(\s*productData\?\.authorId,\s*productData\?\.productId,\s*adultYn,\s*shouldLoadSecondaryProductDetailData\s*\)/,
  "Same-author products should be delayed until secondary product-detail data is enabled"
);
assert.match(
  source,
  /isAuthInitialized/,
  "Product detail should wait for auth hydration before owner/admin episode scope decisions"
);
assert.match(
  source,
  /const canUseUserScope =\s*isAuthInitialized && !!accessToken && !!user\?\.userId && isAuthenticated;/,
  "Product detail should not trust user storage before auth initialization"
);
assert.match(
  source,
  /const isUserScopePending =\s*isAuthInitialized && !!accessToken && isAuthenticated && !user\?\.userId;/,
  "Product detail should not fetch auth-scoped details before the user id is hydrated"
);
assert.match(
  source,
  /const productDetailCacheIdentity =\s*!isAuthInitialized \|\| isUserScopePending\s*\?\s*"auth-pending"\s*:\s*canUseUserScope\s*\?\s*`user:\$\{user\.userId\}`\s*:\s*"guest";/,
  "Product detail should separate owner/admin product-detail cache from guest cache"
);
assert.match(
  source,
  /useSelectProductDetail\(\s*productId,\s*productDetailCacheIdentity,\s*isAuthInitialized && !isUserScopePending\s*\)/,
  "Product detail should wait for auth initialization before fetching details-group"
);
assert.match(
  source,
  /const shouldUseOwnerEpisodeList = canUseUserScope && \(isProductOwner \|\| isAdminCPEditor\);/,
  "Product detail should distinguish hydrated owner/admin episode list scope from public reader scope"
);
assert.match(
  source,
  /initialOwnerEpisodes=\{shouldUseOwnerEpisodeList \? ownerEpisodes : undefined\}/,
  "Product detail should pass details-group episodes only for owner/admin episode lists"
);
assert.match(
  source,
  /episodeCount=\{displayEpisodeCount\}/,
  "Product detail should show an owner/admin episode count when rendering owner/admin episodes"
);
assert.match(
  source,
  /&nbsp;\{displayEpisodeCount \|\| 0\}/,
  "Product detail episode tab count should match the owner/admin episode list count"
);
assert.match(
  commentQuerySource,
  /enabled: enabled && !Number\.isNaN\(productId\)/,
  "useSelectComment should support delaying product comments"
);
assert.match(
  authorProductQuerySource,
  /queryKey: \["selectAuthorProducts", authorId, productId, adultYnParam\]/,
  "useSelectAuthorProducts should key adult filtering to avoid stale cross-filter cache"
);
assert.match(
  authorProductQuerySource,
  /enabled: enabled && !!authorId && !!productId/,
  "useSelectAuthorProducts should support delaying same-author fetches"
);
assert.match(
  productQuerySource,
  /export const useSelectProductDetail = \(\s*productId: number,\s*cacheIdentity: string = "guest",\s*enabled: boolean = true\s*\)/,
  "useSelectProductDetail should accept a cache identity and enabled gate"
);
assert.match(
  productQuerySource,
  /queryKey: \["selectProductDetail", productId, cacheIdentity\]/,
  "Product detail query key should include auth scope to avoid owner/private cache leakage"
);
assert.match(
  productQuerySource,
  /enabled: enabled && !!productId/,
  "Product detail query should wait until auth scope is known"
);
assert.match(
  commentAreaSource,
  /enabled\?: boolean;/,
  "CommentArea should let product detail delay the internal comment query"
);
assert.match(
  productCoverAreaSource,
  /const displayEpisodeCount = episodeCount \?\? data\?\.totalOpenEpisodeCount \?\? 0;/,
  "ProductCoverArea should display the page-provided owner/admin episode count when available"
);
assert.match(
  productCoverAreaSource,
  /const paidOpenDateLabel =\s*data\?\.priceType === "paid" \? formatPaidOpenDate\(data\?\.paidOpenDate\) : "";/,
  "ProductCoverArea should only compute a paid-open date label for paid products"
);
assert.match(
  productCoverAreaSource,
  /유료전환일:/,
  "ProductCoverArea should label the paid conversion date with a colon on the detail header"
);
assert.match(
  productCoverAreaSource,
  /paidOpenDateLabel && \(/,
  "ProductCoverArea should hide the paid conversion date when the backend has no date"
);
assert.match(
  productCoverAreaSource,
  /\{displayEpisodeCount\}화[\s\S]*getUpdateFrequency\([\s\S]*data\.properties\?\.updateFrequency \|\| ""[\s\S]*<\/div>\s*\{paidOpenDateLabel && \([\s\S]*유료전환일:/,
  "ProductCoverArea should render the paid conversion date on the line after total episodes and update frequency"
);
assert.doesNotMatch(
  productCoverAreaSource,
  /\{data\.totalOpenEpisodeCount\}화/,
  "ProductCoverArea should not force public open episode count in owner/admin views"
);

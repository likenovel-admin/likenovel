import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProductEpisodes.tsx", import.meta.url), "utf8");
const episodeHookSource = readFileSync(
  new URL("../../app/api/query/episode/index.ts", import.meta.url),
  "utf8"
);
const productPageSource = readFileSync(
  new URL("../../app/product/[id]/ProductDetailClient.tsx", import.meta.url),
  "utf8"
);
const productDtoSource = readFileSync(
  new URL("../../app/api/query/product/dto.ts", import.meta.url),
  "utf8"
);
const cacheStatusModalSource = readFileSync(
  new URL("../modal/CacheStatusModal.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /const defaultIsDescSort = priceType !== "paid";/,
  "ProductEpisodes should default paid products to first-episode order"
);
assert.match(
  source,
  /const \[isDescSort, setIsDescSort\] = useState\(defaultIsDescSort\);/,
  "ProductEpisodes sort state should use the price-type default"
);
assert.match(
  source,
  /setIsDescSort\(defaultIsDescSort\);/,
  "ProductEpisodes should sync the default sort after priceType is resolved"
);
assert.match(
  source,
  /const hasResolvedPriceType = priceType === "paid" \|\| priceType === "free";/,
  "ProductEpisodes should wait until priceType is resolved before fetching episodes"
);
assert.match(
  source,
  /const sortReadyKey = hasResolvedPriceType \? `\$\{productId\}:\$\{priceType\}` : "";/,
  "ProductEpisodes should key sort readiness by product and price type"
);
assert.match(
  source,
  /const isEpisodeQueryEnabled =\s*hasResolvedPriceType && sortReadyFor === sortReadyKey;/,
  "ProductEpisodes should enable episode queries only after sort state is ready"
);
assert.match(
  source,
  /isDescSort \? "desc" : "asc",\s*isEpisodeQueryEnabled/,
  "ProductEpisodes should request descending or ascending episode order from the API"
);
assert.match(
  source,
  /initialOwnerEpisodes\?: IEpisode\[\];/,
  "ProductEpisodes should accept details-group episodes for owner/admin views"
);
assert.match(
  source,
  /const shouldUseOwnerEpisodes = \(isAuthor \|\| isAdminCPEditor\) && !!initialOwnerEpisodes;/,
  "ProductEpisodes should only switch to details-group episodes for owner/admin views"
);
assert.match(
  source,
  /isEpisodeQueryEnabled && !shouldUseOwnerEpisodes/,
  "ProductEpisodes should not call the public episode list when owner/admin details-group episodes are available"
);
assert.match(
  source,
  /shouldUseOwnerEpisodes \? sortedOwnerEpisodes :/,
  "ProductEpisodes should render sorted owner/admin episodes from details-group when available"
);
assert.match(
  source,
  /if \(!shouldUseOwnerEpisodes && newCount >= allEpisodes.length - 5\)/,
  "ProductEpisodes should only fetch more pages for the public episode list"
);
assert.match(
  source,
  /const canBypassEpisodePayment = isAuthor \|\| isAdminCPEditor;/,
  "ProductEpisodes should let authors/admins open owned management-visible paid episodes without the rent modal"
);
assert.match(
  episodeHookSource,
  /enabled: enabled && !!productId/,
  "useSelectEpisodes should support disabling the episode query until sort defaults are known"
);
assert.match(
  source,
  /waitForFreeYn: isWaitForFreePaidEpisode \? "Y" : "N"/,
  "ProductEpisodes should pass the WFF modal flag when a WFF paid episode opens the purchase modal"
);
assert.match(
  source,
  /setWffTimeRemaining\(`\$\{hours\}시간 \$\{minutes\}분`\)/,
  "ProductEpisodes should show WFF remaining time as hours and minutes"
);
assert.match(
  source,
  /void refetchTickets\(\)/,
  "ProductEpisodes should refetch tickets when WFF recharge becomes due or pending"
);
assert.match(
  source,
  /wffRechargePending \|\|/,
  "ProductEpisodes should suppress the countdown while WFF ticket recharge is pending"
);
assert.match(
  source,
  /!wffRechargePending && wffTimeRemaining/,
  "ProductEpisodes should render WFF remaining time only outside pending state"
);
assert.match(
  productPageSource,
  /productData\?\.badge\?\.waitForFreeYn === "Y"/,
  "product detail should treat waitForFreeYn=Y as WFF"
);
assert.match(
  productPageSource,
  /productData\?\.badge\?\.waitingForFreeYn === "Y"/,
  "product detail should treat waitingForFreeYn=Y as WFF"
);
assert.match(
  productPageSource,
  /ep.priceType === "paid" && ep.ownType !== "own"/,
  "ownership bulk purchase should include rented paid episodes that are not owned"
);
assert.match(
  productPageSource,
  /const serialEpisodeOwnPrice/,
  "product detail should compute the serial episode ownership price once for WFF modal payloads"
);
assert.match(
  productPageSource,
  /productData\?\.seriesRegularPrice/,
  "WFF modal ownership price should come from the serial episode price when available"
);
assert.match(
  productPageSource,
  /episodeOwnPrice=\{serialEpisodeOwnPrice\}/,
  "WFF modal should not hard-code the single episode ownership price"
);
assert.match(
  productPageSource,
  /episodeTypePaidCount \* serialEpisodeOwnPrice/,
  "WFF bulk purchase price should use the same serial episode unit price"
);
assert.match(
  productPageSource,
  /queryKey: \["getEpisodeList"\]/,
  "product detail should invalidate available-ticket state after ticket issuance"
);
assert.doesNotMatch(
  productPageSource,
  /ep\.ownType !== "rental"/,
  "ownership bulk purchase should not exclude rental access from own purchase targets"
);
assert.match(
  productDtoSource,
  /wff_next_charge_at_ms: number \| null;/,
  "available ticket DTO should expose the WFF recharge timestamp in milliseconds"
);
assert.match(
  productDtoSource,
  /wff_recharge_pending: boolean;/,
  "available ticket DTO should expose WFF recharge pending state"
);
assert.match(
  cacheStatusModalSource,
  /device === "mobile"/,
  "CacheStatusModal should keep mobile rendering on BottomSheetContainer"
);
assert.match(
  cacheStatusModalSource,
  /<BottomSheetContainer/,
  "CacheStatusModal should render as a bottom sheet on mobile"
);
assert.match(
  cacheStatusModalSource,
  /waitForFreeTickets/,
  "WFF modal should use WFF tickets separately from generic rental tickets"
);
assert.match(
  cacheStatusModalSource,
  /\.toLowerCase\(\)/,
  "WFF modal should normalize ticket type casing"
);
assert.match(
  cacheStatusModalSource,
  /waitingforfree/,
  "WFF modal should accept compact/camel-cased WFF ticket type variants after normalization"
);
assert.match(
  cacheStatusModalSource,
  /rentalPrice: 0/,
  "WFF bulk purchase should open the cash modal as ownership-only"
);
assert.match(
  cacheStatusModalSource,
  /기다무 대여권/,
  "WFF modal should show the WFF ticket action"
);
assert.match(
  cacheStatusModalSource,
  /소장권/,
  "WFF modal should show the ownership action"
);
assert.match(
  cacheStatusModalSource,
  /일괄구매/,
  "WFF modal should show the ownership bulk purchase action"
);
assert.doesNotMatch(
  cacheStatusModalSource,
  /#FFD339/,
  "WFF modal should not use Kakao-style yellow CTA color"
);
assert.doesNotMatch(
  cacheStatusModalSource,
  /rounded-\[28px\]/,
  "WFF modal should not use Kakao-style pill radius"
);

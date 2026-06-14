import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProductEpisodes.tsx", import.meta.url), "utf8");
const episodeHookSource = readFileSync(
  new URL("../../app/api/query/episode/index.ts", import.meta.url),
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

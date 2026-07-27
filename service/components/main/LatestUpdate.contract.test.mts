import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./LatestUpdate.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /headerText="장르별 최신 업데이트 작품"/,
  "LatestUpdate should use the adapted Munpia section title"
);
assert.match(
  source,
  /LATEST_UPDATE_GENRE_TABS\.map/,
  "LatestUpdate should render every genre tab"
);
assert.match(
  source,
  /aria-pressed=\{activeGenre === genre\}/,
  "LatestUpdate should expose the selected genre to assistive technology"
);
assert.match(
  source,
  /filterLatestUpdateProducts\(products, activeGenre\)/,
  "LatestUpdate should render the selected genre through the tested filter"
);
assert.match(
  source,
  /grid-cols-1[^"]*md:grid-cols-2[^"]*lg:grid-cols-3/,
  "LatestUpdate should adapt the Munpia three-column list to mobile and tablet"
);
assert.match(
  source,
  /visibleProducts\.map\(\(product, index\) =>/,
  "LatestUpdate should derive responsive visibility from each product position"
);
assert.match(
  source,
  /index >= 14[\s\S]*"hidden lg:block"[\s\S]*index >= 7[\s\S]*"hidden md:block"/,
  "LatestUpdate should keep seven visible rows at mobile, tablet, and desktop widths"
);
assert.match(
  source,
  /<SquareBadge type="up" \/>/,
  "LatestUpdate should keep the update badge beside each title"
);
assert.match(
  source,
  /\{product\.title\}[\s\S]*product\.authorNickname \|\| product\.authorName/,
  "LatestUpdate should show title first and author below it"
);
assert.match(
  source,
  /setPendingProductDetailEntrySource\([\s\S]*HOME_BOTTOM_SUGGEST[\s\S]*router\.push\(buildProductDetailPath\(product\.productId\)\)/,
  "LatestUpdate should preserve the existing latest-update detail attribution"
);
assert.match(
  source,
  /router\.push\("\/product\/free\/normal"\)/,
  "LatestUpdate more action should lead to the matching general-serial catalog"
);

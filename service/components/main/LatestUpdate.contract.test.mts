import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./LatestUpdate.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /headerText="연재 업데이트"/,
  "LatestUpdate should use the requested section title"
);
assert.match(
  source,
  /availableGenreTabs\.map/,
  "LatestUpdate should render only genres available in the current free products"
);
assert.doesNotMatch(
  source,
  /className="flex w-max[^"]*(?:lg:justify-between|lg:gap-0|min-w-full)/,
  "LatestUpdate should keep genre chips compact instead of distributing them across the row"
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
  /mobilePages\.map\(\(page, pageIndex\) =>/,
  "LatestUpdate should render mobile products in swipeable three-item pages"
);
assert.match(
  source,
  /snap-x[^"]*snap-mandatory[^"]*overflow-x-auto/,
  "LatestUpdate mobile pages should use native horizontal scroll snapping"
);
assert.match(
  source,
  /onScroll=\{handleMobileScroll\}/,
  "LatestUpdate should synchronize the paging indicator with native swipes"
);
assert.match(
  source,
  /currentPage === pageIndex[\s\S]*"w-\[28px\] bg-\[#0255d9\]"[\s\S]*"w-\[10px\] bg-gray-300"/,
  "LatestUpdate should reuse the main banner carousel paging indicator"
);
assert.match(
  source,
  /setActiveGenre\(genre\);[\s\S]*goToPage\(0\);/,
  "LatestUpdate should return to the first mobile page when the genre changes"
);
assert.match(
  source,
  /aria-hidden=\{pageIndex !== currentPage\}/,
  "LatestUpdate should hide offscreen mobile pages from assistive technology"
);
assert.match(
  source,
  /tabIndex=\{isFocusable \? undefined : -1\}/,
  "LatestUpdate should remove offscreen product buttons from keyboard navigation"
);
assert.match(
  source,
  /visibleProducts\.map\(\(product\) =>[\s\S]*renderProductItem\(product, true\)/,
  "LatestUpdate should keep desktop product buttons keyboard-focusable"
);
assert.doesNotMatch(
  source,
  /setInterval/,
  "LatestUpdate product pages should move only by user action"
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./FreeTop.tsx", import.meta.url), "utf8");

const pcBlock = source.match(
  /\{\/\* PC\/태블릿: 5x3 그리드\(페이지네이션\) \*\/\}([\s\S]*)<div className="absolute top-\[50%\] left-\[-15px\]/
)?.[1];
const mobileBlock = source.match(
  /\{\/\* 모바일: 문피아 스타일\(2열 x 4행\) 가로 스와이프 구좌 \*\/\}([\s\S]*)\{\/\* PC\/태블릿: 5x3 그리드\(페이지네이션\) \*\//
)?.[1];

assert.ok(pcBlock, "PC FreeTop block should be found");
assert.ok(mobileBlock, "mobile FreeTop block should be found");

assert.match(
  pcBlock,
  /text-13pxr font-semibold leading-\[17px\] line-clamp-2/,
  "PC FreeTop title should use the smaller title size",
);

assert.doesNotMatch(
  pcBlock,
  /product\.genre/,
  "PC FreeTop card should not render genre text",
);

assert.doesNotMatch(
  pcBlock,
  /border-light-gray-400|shadow-sm/,
  "PC FreeTop card should not render the old outlined box styling",
);

assert.match(
  pcBlock,
  /absolute bottom-4pxr left-4pxr/,
  "PC FreeTop UP badge should be overlaid on the cover lower-left",
);

assert.match(
  mobileBlock,
  /absolute bottom-2pxr left-2pxr scale-\[0\.72\] origin-bottom-left/,
  "mobile FreeTop UP badge should be overlaid small on the cover lower-left",
);

assert.match(
  mobileBlock,
  /<SquareBadge type="up" \/>/,
  "mobile FreeTop cards should render the UP badge for updated products",
);

const titleIndex = pcBlock.indexOf("{product.title}");
const authorIndex = pcBlock.indexOf("userNickname={product.authorNickname");
const interestIndex = pcBlock.indexOf("<InterestBadge");
const upBadgeIndex = pcBlock.indexOf('<SquareBadge type="up" />');

assert.ok(titleIndex >= 0, "PC FreeTop card should render title");
assert.ok(authorIndex > titleIndex, "author nickname should sit below title");
assert.ok(
  upBadgeIndex >= 0 && upBadgeIndex < titleIndex,
  "PC FreeTop UP badge should not sit in the title line",
);
assert.ok(
  interestIndex > authorIndex,
  "interest badge should remain after title and author information",
);

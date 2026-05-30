import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./FreeTop.tsx", import.meta.url), "utf8");

const pcBlock = source.match(
  /\{\/\* PC\/태블릿: 5x3 그리드\(페이지네이션\) \*\/\}([\s\S]*)<div className="absolute top-\[50%\] left-\[-15px\]/
)?.[1];

assert.ok(pcBlock, "PC FreeTop block should be found");

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

const titleIndex = pcBlock.indexOf("{product.title}");
const authorIndex = pcBlock.indexOf("userNickname={product.authorNickname");
const interestIndex = pcBlock.indexOf("<InterestBadge");

assert.ok(titleIndex >= 0, "PC FreeTop card should render title");
assert.ok(authorIndex > titleIndex, "author nickname should sit below title");
assert.ok(
  interestIndex > authorIndex,
  "interest badge should remain after title and author information",
);

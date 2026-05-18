import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const freeTopSource = readSource("./FreeTop.tsx");
const productListCardSource = readSource("../common/ProductListCard.tsx");
const productCoverCardSource = readSource("../common/ProductCoverCard.tsx");
const tasteSectionSource = readSource("../recommendation/TasteSection.tsx");

assert.match(freeTopSource, /optimized:\s*true/);
assert.match(freeTopSource, /sizes:\s*"56px"/);
assert.match(
  freeTopSource,
  /sizes:\s*"72px"/,
);

assert.match(productListCardSource, /optimized:\s*true/);
assert.match(
  productListCardSource,
  /sizes:\s*"110px"/,
);
assert.match(
  productListCardSource,
  /sizes:\s*"86px"/,
);

assert.match(
  productCoverCardSource,
  /const isDefaultCoverImage = coverImagePath === DEFAULT_PRODUCT_IMAGE/,
);
assert.match(productCoverCardSource, /unoptimized=\{isDefaultCoverImage\}/);
assert.match(
  productCoverCardSource,
  /sizes="\(max-width: 767px\) 108px, 142px"/,
);

assert.match(
  tasteSectionSource,
  /sizes="\(max-width: 767px\) 108px, 142px"/,
);
assert.match(
  tasteSectionSource,
  /src=\{DEFAULT_PRODUCT_IMAGE\}[\s\S]*\bunoptimized\b/,
);
assert.match(
  tasteSectionSource,
  /const isDefaultCoverImage = coverImageSrc === DEFAULT_PRODUCT_IMAGE/,
);

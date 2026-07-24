import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductListCard.tsx", import.meta.url),
  "utf8",
);

assert.match(source, /import Link from "next\/link"/);
assert.match(
  source,
  /const productDetailPath = buildProductDetailPath\(data\.productId\)/,
);
assert.match(source, /const handleProductLinkClick = \(/);
assert.match(source, /event\.stopPropagation\(\)/);
assert.match(source, /href=\{productDetailPath\}/);
assert.match(source, /onClick=\{handleProductLinkClick\}/);

const productTitleLinkCount = source.match(
  /href=\{productDetailPath\}[\s\S]*?\{data\.title\}[\s\S]*?<\/Link>/g,
)?.length;

assert.equal(
  productTitleLinkCount,
  2,
  "desktop and mobile product titles should both be crawlable links",
);

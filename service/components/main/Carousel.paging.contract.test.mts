import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Carousel.tsx", import.meta.url), "utf8");

assert.doesNotMatch(source, /getBannerCarouselPageSize/);
assert.match(
  source,
  /slidesToShow:\s*1/,
  "banner carousel should show one focused banner instead of 3-up pages",
);
assert.match(
  source,
  /centerMode:\s*!\s*isSingle/,
  "banner carousel should use the previous one-card center mode",
);
assert.match(
  source,
  /src=\{isTablet\s*\?\s*panel\.mobileImgPath\s*:\s*panel\.pcImgPath\}/,
  "single-banner carousel should keep the previous pc/mobile image fallback",
);
assert.match(
  source,
  /primaryPanels\.map\(\(_, index\)/,
  "dot navigation should be per banner, not per 3-card page",
);
assert.doesNotMatch(
  source,
  /Array\.from\(\{\s*length:\s*pageCount\s*\}\)/,
  "dot count should not be page-based after 3-up rollback",
);

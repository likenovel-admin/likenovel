import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Carousel.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /getBannerCarouselPageSize/,
  "Carousel should use the shared banner carousel page-size helper",
);
assert.match(
  source,
  /slidesToScroll:\s*pageSize/,
  "desktop carousel arrows/autoplay should advance by one visible page",
);
assert.match(
  source,
  /centerMode:\s*count\s*>\s*1/,
  "mobile carousel should center the active banner card while showing side peeks",
);
assert.match(
  source,
  /centerPadding:\s*count\s*>\s*1\s*\?\s*"32px"\s*:\s*"0px"/,
  "mobile carousel should use fixed side padding for centered banner peeks",
);
assert.match(
  source,
  /getBannerCarouselPageStartIndex/,
  "dot navigation should jump to the first slide of each 3-card page",
);
assert.match(
  source,
  /Array\.from\(\{\s*length:\s*pageCount\s*\}\)/,
  "dot count should be page-based, not one dot per banner",
);
assert.match(
  source,
  /src=\{panel\.pcImgPath\}/,
  "unified carousel banners should use the same uploaded image on every viewport",
);
assert.doesNotMatch(
  source,
  /isTablet\s*\?\s*panel\.mobileImgPath\s*:\s*panel\.pcImgPath/,
  "unified carousel banners should not switch to a separate mobile image",
);

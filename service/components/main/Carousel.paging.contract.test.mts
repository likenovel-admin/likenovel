import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Carousel.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /BANNER_CAROUSEL_CARD_WIDTH/,
  "Carousel should keep each banner card on the fixed 364px width contract",
);
assert.match(
  source,
  /BANNER_CAROUSEL_CARD_HEIGHT/,
  "Carousel should keep each banner card on the fixed 414px height contract",
);
assert.match(
  source,
  /getBannerCarouselVisibleCount/,
  "Carousel should reduce visible card count instead of shrinking cards",
);
assert.match(
  source,
  /getBannerCarouselViewportWidth/,
  "Carousel viewport should be sized from fixed card width and gap",
);
assert.match(
  source,
  /ResizeObserver/,
  "Carousel should measure available width and choose 3/2/1 visible fixed cards",
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
assert.match(
  source,
  /width:\s*BANNER_CAROUSEL_CARD_WIDTH/,
  "banner img width should be fixed, not inherited from slide width",
);
assert.match(
  source,
  /height:\s*BANNER_CAROUSEL_CARD_HEIGHT/,
  "banner img height should be fixed, not inherited from slide width",
);
assert.doesNotMatch(
  source,
  /react-slick/,
  "fixed-size carousel should not use react-slick because it divides slide widths from the viewport",
);
assert.doesNotMatch(
  source,
  /isTablet\s*\?\s*panel\.mobileImgPath\s*:\s*panel\.pcImgPath/,
  "unified carousel banners should not switch to a separate mobile image",
);

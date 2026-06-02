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
  "Carousel should keep desktop visible card count calculation",
);
assert.match(
  source,
  /getBannerCarouselViewportWidth/,
  "Carousel viewport should be sized from fixed card width and gap",
);
assert.match(
  source,
  /ResizeObserver/,
  "Carousel should measure available width for desktop pages and mobile peek cards",
);
assert.match(
  source,
  /getBannerCarouselPageStartIndex/,
  "dot navigation should jump to the first slide of each 3-card page",
);
assert.match(
  source,
  /Array\.from\(\{\s*length:\s*pageCount\s*\}\)/,
  "dot count should follow the active desktop/mobile page count",
);
assert.match(
  source,
  /BANNER_CAROUSEL_MOBILE_BREAKPOINT/,
  "Carousel should split mobile peek behavior from desktop 3-up behavior",
);
assert.match(
  source,
  /BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS/,
  "desktop carousel should use the slower desktop auto-rotate interval",
);
assert.match(
  source,
  /BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS/,
  "mobile carousel should use the faster mobile auto-rotate interval",
);
assert.doesNotMatch(
  source,
  /},\s*5000\)/,
  "Carousel should not hard-code the old 5-second auto-rotate interval",
);
assert.match(
  source,
  /getBannerCarouselMobileCardWidth/,
  "mobile carousel should shrink the centered card to leave side peeks",
);
assert.match(
  source,
  /getBannerCarouselMobileTrackPanelIndexes/,
  "mobile carousel should render cloned edge panels for a visual loop",
);
assert.match(
  source,
  /getBannerCarouselMobileTranslateX/,
  "mobile carousel should offset the cloned track so the first slide has a previous peek",
);
assert.match(
  source,
  /onPointerDown/,
  "mobile carousel should use pointer events so touch swipe can move banners",
);
assert.match(
  source,
  /touchAction:\s*"pan-y"/,
  "mobile carousel should allow vertical scroll while handling horizontal swipes",
);
assert.match(
  source,
  /src=\{panel\.pcImgPath\}/,
  "unified carousel banners should use the same uploaded image on every viewport",
);
assert.match(
  source,
  /width:\s*cardWidth/,
  "banner img width should use the desktop fixed width or mobile peek width",
);
assert.match(
  source,
  /height:\s*cardHeight/,
  "banner img height should preserve the banner aspect ratio on mobile",
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

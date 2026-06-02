import assert from "node:assert/strict";
import {
  BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS,
  BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS,
  getBannerCarouselMobileCardHeight,
  getBannerCarouselMobileCardWidth,
  getBannerCarouselMobileTrackPanelIndexes,
  getBannerCarouselMobileTranslateX,
  getBannerCarouselPageStartIndex,
  getBannerCarouselPageCount,
  getBannerCarouselVisibleCount,
  getBannerCarouselViewportWidth,
} from "./bannerCarouselPaging.ts";

assert.equal(BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS, 7000);
assert.equal(BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS, 4000);

assert.equal(getBannerCarouselVisibleCount(1120, 6), 3);
assert.equal(getBannerCarouselVisibleCount(1023, 6), 2);
assert.equal(getBannerCarouselVisibleCount(768, 6), 2);
assert.equal(getBannerCarouselVisibleCount(390, 6), 1);
assert.equal(getBannerCarouselVisibleCount(1120, 2), 2);
assert.equal(getBannerCarouselVisibleCount(1120, 0), 0);

assert.equal(getBannerCarouselViewportWidth(3), 1110);
assert.equal(getBannerCarouselViewportWidth(2), 737);
assert.equal(getBannerCarouselViewportWidth(1), 364);

assert.equal(getBannerCarouselMobileCardWidth(390), 342);
assert.equal(getBannerCarouselMobileCardWidth(375), 327);
assert.equal(getBannerCarouselMobileCardWidth(0), 0);
assert.equal(getBannerCarouselMobileCardHeight(342), 389);
assert.equal(getBannerCarouselMobileCardHeight(0), 0);
assert.deepEqual(getBannerCarouselMobileTrackPanelIndexes(0), []);
assert.deepEqual(getBannerCarouselMobileTrackPanelIndexes(1), [0]);
assert.deepEqual(getBannerCarouselMobileTrackPanelIndexes(4), [3, 0, 1, 2, 3, 0]);
assert.equal(getBannerCarouselMobileTranslateX(0, 342), -327);
assert.equal(getBannerCarouselMobileTranslateX(1, 342), -678);

assert.equal(getBannerCarouselPageCount(0, 3), 0);
assert.equal(getBannerCarouselPageCount(1, 3), 1);
assert.equal(getBannerCarouselPageCount(3, 3), 1);
assert.equal(getBannerCarouselPageCount(4, 3), 2);
assert.equal(getBannerCarouselPageCount(6, 3), 2);
assert.equal(getBannerCarouselPageCount(7, 3), 3);
assert.equal(getBannerCarouselPageCount(6, 2), 3);
assert.equal(getBannerCarouselPageCount(6, 1), 6);

assert.equal(getBannerCarouselPageStartIndex(0, 6, 3), 0);
assert.equal(getBannerCarouselPageStartIndex(1, 6, 3), 3);
assert.equal(getBannerCarouselPageStartIndex(1, 5, 3), 2);
assert.equal(getBannerCarouselPageStartIndex(2, 6, 2), 4);

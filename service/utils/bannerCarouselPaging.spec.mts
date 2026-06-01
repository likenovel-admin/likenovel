import assert from "node:assert/strict";
import {
  getBannerCarouselPageStartIndex,
  getBannerCarouselPageCount,
  getBannerCarouselVisibleCount,
  getBannerCarouselViewportWidth,
} from "./bannerCarouselPaging.ts";

assert.equal(getBannerCarouselVisibleCount(1120, 6), 3);
assert.equal(getBannerCarouselVisibleCount(1023, 6), 2);
assert.equal(getBannerCarouselVisibleCount(768, 6), 2);
assert.equal(getBannerCarouselVisibleCount(390, 6), 1);
assert.equal(getBannerCarouselVisibleCount(1120, 2), 2);
assert.equal(getBannerCarouselVisibleCount(1120, 0), 0);

assert.equal(getBannerCarouselViewportWidth(3), 1110);
assert.equal(getBannerCarouselViewportWidth(2), 737);
assert.equal(getBannerCarouselViewportWidth(1), 364);

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

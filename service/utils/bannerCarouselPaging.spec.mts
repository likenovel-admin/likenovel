import assert from "node:assert/strict";
import {
  getBannerCarouselActivePage,
  getBannerCarouselMobileCenterPadding,
  getBannerCarouselPageCount,
  getBannerCarouselPageSize,
  getBannerCarouselPageStartIndex,
} from "./bannerCarouselPaging.ts";

assert.equal(getBannerCarouselPageSize(0), 3);
assert.equal(getBannerCarouselPageSize(3), 3);
assert.equal(getBannerCarouselPageSize(4), 3);
assert.equal(getBannerCarouselPageSize(6), 3);

assert.equal(getBannerCarouselPageCount(0), 0);
assert.equal(getBannerCarouselPageCount(1), 1);
assert.equal(getBannerCarouselPageCount(3), 1);
assert.equal(getBannerCarouselPageCount(4), 2);
assert.equal(getBannerCarouselPageCount(6), 2);
assert.equal(getBannerCarouselPageCount(7), 3);

assert.equal(getBannerCarouselPageStartIndex(0), 0);
assert.equal(getBannerCarouselPageStartIndex(1), 3);
assert.equal(getBannerCarouselPageStartIndex(2), 6);

assert.equal(getBannerCarouselActivePage(0, 6), 0);
assert.equal(getBannerCarouselActivePage(2, 6), 0);
assert.equal(getBannerCarouselActivePage(3, 6), 1);
assert.equal(getBannerCarouselActivePage(5, 6), 1);

assert.equal(getBannerCarouselMobileCenterPadding(390), 32);
assert.equal(getBannerCarouselMobileCenterPadding(768), 202);
assert.equal(getBannerCarouselMobileCenterPadding(1023), 330);

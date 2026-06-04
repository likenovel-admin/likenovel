import assert from "node:assert/strict";
import {
  COMPANY_NOTICE_CAROUSEL_ASPECT_RATIO,
  COMPANY_NOTICE_CAROUSEL_CARD_GAP,
  COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
  COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE,
  COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT,
  getCompanyNoticeCarouselCardMetrics,
  getCompanyNoticeCarouselPageCount,
  getCompanyNoticeCarouselPageStartIndex,
  getCompanyNoticeCarouselVisibleCount,
  getCompanyNoticeCarouselViewportWidth,
} from "./companyNoticeCarouselLayout.ts";

assert.equal(COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH, 1120);
assert.equal(COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE, 3);
assert.equal(COMPANY_NOTICE_CAROUSEL_CARD_GAP, 10);
assert.equal(COMPANY_NOTICE_CAROUSEL_ASPECT_RATIO, 2);
assert.equal(COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT, 768);

assert.equal(getCompanyNoticeCarouselVisibleCount(1120, 5), 3);
assert.equal(getCompanyNoticeCarouselVisibleCount(767, 5), 1);
assert.equal(getCompanyNoticeCarouselVisibleCount(390, 5), 1);
assert.equal(getCompanyNoticeCarouselVisibleCount(1120, 1), 1);
assert.equal(getCompanyNoticeCarouselVisibleCount(1120, 0), 0);

assert.equal(getCompanyNoticeCarouselViewportWidth(3), 1120);
assert.equal(getCompanyNoticeCarouselViewportWidth(1), 366.6666666666667);
assert.equal(getCompanyNoticeCarouselViewportWidth(0), 0);

assert.deepEqual(getCompanyNoticeCarouselCardMetrics(1120, 3), {
  width: 366.6666666666667,
  height: 183.33333333333334,
});
assert.deepEqual(getCompanyNoticeCarouselCardMetrics(390, 1), {
  width: 390,
  height: 195,
});

assert.equal(getCompanyNoticeCarouselPageCount(5, 3), 2);
assert.equal(getCompanyNoticeCarouselPageCount(5, 1), 5);
assert.equal(getCompanyNoticeCarouselPageCount(1, 3), 1);
assert.equal(getCompanyNoticeCarouselPageCount(0, 3), 0);

assert.equal(getCompanyNoticeCarouselPageStartIndex(0, 5, 3), 0);
assert.equal(getCompanyNoticeCarouselPageStartIndex(1, 5, 3), 3);
assert.equal(
  getCompanyNoticeCarouselPageStartIndex(1, 4, 3),
  3,
  "last desktop page may intentionally show a single remaining card",
);

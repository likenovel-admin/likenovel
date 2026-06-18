import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const freeTopSource = readSource("./FreeTop.tsx");
const productListCardSource = readSource("../common/ProductListCard.tsx");
const productCoverCardSource = readSource("../common/ProductCoverCard.tsx");
const tasteSectionSource = readSource("../recommendation/TasteSection.tsx");
const homePageSource = readSource("../../app/page.tsx");

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
  /sizes="\(max-width: 767px\) 132px, 160px"/,
);
assert.match(
  tasteSectionSource,
  /src=\{DEFAULT_PRODUCT_IMAGE\}[\s\S]*\bsizes="\(max-width: 767px\) 132px, 160px"[\s\S]*\bunoptimized\b/,
);
assert.match(
  tasteSectionSource,
  /const isDefaultCoverImage =\s*coverImageSrc === DEFAULT_PRODUCT_IMAGE/,
);
assert.match(tasteSectionSource, /const itemsPerPage = 4/);
assert.match(tasteSectionSource, /episodeCount/);
assert.match(tasteSectionSource, /const showNextPreview = isDesktop && currentPage < lastPage/);
assert.match(
  tasteSectionSource,
  /currentPage \+ itemsPerPage \+ \(showNextPreview \? 1 : 0\)/,
);
assert.match(tasteSectionSource, /bg-gradient-to-r from-white\/0 to-white/);
assert.match(tasteSectionSource, /right-\[-52px\]/);
assert.match(tasteSectionSource, /const showNextArrow = showArrows && currentPage < lastPage/);
assert.match(
  homePageSource,
  /relative min-h-screen overflow-x-hidden pt-\[130px\] md:pt-\[115px\] pb-\[94px\]/,
);
assert.match(
  tasteSectionSource,
  /\[\.\.\.section\.products\]\.sort\(\s*\(a, b\) => b\.episodeCount - a\.episodeCount\s*\)/,
);
assert.match(tasteSectionSource, /blur-\[30px\]/);
assert.match(tasteSectionSource, /rounded-\[20px\]/);
assert.match(
  tasteSectionSource,
  /회원님의 작품 읽기 패턴을 통해 골라드려요\./,
);
assert.match(tasteSectionSource, /작품 키워드/);
assert.match(tasteSectionSource, /isSlotTitleDuplicateLabel/);
assert.match(tasteSectionSource, /isSlotTitleDuplicateLabel\(tag, slotTitle\)/);
assert.match(tasteSectionSource, /const PRODUCT_LABEL_LIMIT = 3/);
assert.match(tasteSectionSource, /const getProductLabels =/);
assert.match(tasteSectionSource, /labels\.length >= PRODUCT_LABEL_LIMIT/);
assert.match(tasteSectionSource, /productLabels\.map\(\(productLabel\)/);
assert.doesNotMatch(tasteSectionSource, /const productLabel = getProductLabel/);
assert.doesNotMatch(
  tasteSectionSource,
  /AI사서 키워드|const subtitle = section\.reason|getSectionLabel|DIMENSION_LABELS|행동 신호 기반/,
);
assert.doesNotMatch(tasteSectionSource, /새로운 추천 보기|algorithm-more-button/);

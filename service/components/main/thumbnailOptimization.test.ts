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
assert.match(
  tasteSectionSource,
  /getLoopedProducts\(sortedProducts, currentPage - 1, itemsPerPage \+ 2\)/,
);
assert.match(tasteSectionSource, /bg-gradient-to-r from-white\/0 to-white/);
assert.match(tasteSectionSource, /bg-gradient-to-l from-white\/0 to-white/);
assert.match(tasteSectionSource, /lg:-mx-\[32px\]/);
assert.match(tasteSectionSource, /lg:w-\[calc\(100%\+64px\)\]/);
assert.match(tasteSectionSource, /lg:-translate-x-\[227px\]/);
assert.match(tasteSectionSource, /const LOOP_PREVIEW_CARD_INDEX = 0/);
assert.match(tasteSectionSource, /const isLoopPreviewCard =/);
assert.match(tasteSectionSource, /tabIndex=\{isLoopPreviewCard \? -1 : undefined\}/);
assert.match(tasteSectionSource, /aria-hidden=\{isLoopPreviewCard \|\| undefined\}/);
assert.match(tasteSectionSource, /isLoopPreviewCard \? "invisible" : ""/);
assert.match(tasteSectionSource, /const isLoopEnabled = isDesktop && totalItems > itemsPerPage/);
assert.match(tasteSectionSource, /\(prev - 1 \+ totalItems\) % totalItems/);
assert.match(tasteSectionSource, /\(prev \+ 1\) % totalItems/);
assert.doesNotMatch(tasteSectionSource, /isDisabled=\{currentPage === 0\}/);
assert.doesNotMatch(tasteSectionSource, /showNextArrow/);
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const reviewCardSource = read("./ReviewCard.tsx");
const lastPageSource = read("./LastPage.tsx");
const epubViewerSource = read("./EpubViewer.tsx");
const commentQuerySource = read("../../app/api/query/comment/index.ts");
const viewerPageSource = read("../../app/viewer/[id]/page.tsx");
const ratingSource = read("./Rating.tsx");
const ratingFormSource = read("./RatingForm.tsx");
const authorNoteSource = read("./AuthorNote.tsx");
const bottomNavSource = read("../menu/ViewerBottomNav.tsx");

assert.doesNotMatch(
  reviewCardSource,
  /if \(!comment\) return null/,
  "the comment entry must remain visible when an episode has no comments"
);
assert.match(
  reviewCardSource,
  />\s*댓글\s*</,
  "the last-page entry must identify itself as comments"
);
assert.match(
  reviewCardSource,
  /"댓글을 남겨보세요"/,
  "the last-page entry must expose a real writable input"
);
assert.match(
  reviewCardSource,
  /aria-label="댓글 등록"/,
  "the icon-only submit action must retain an accessible label"
);
assert.match(
  reviewCardSource,
  /addCommentEpisode\.mutateAsync/,
  "the last page must submit comments inline instead of deferring to the overlay"
);
assert.match(
  reviewCardSource,
  /disabled=\{!canSubmit\}/,
  "the submit action must stay disabled while empty or already submitting"
);
assert.match(
  reviewCardSource,
  /if \(!content \|\| !episodeId \|\| submittingRef\.current\) return;\s*submittingRef\.current = true;/,
  "rapid repeat taps must be rejected synchronously instead of relying on render state"
);
assert.match(
  reviewCardSource,
  /queryKey: \["selectComment", productId, episodeId\]/,
  "an inline submission must refresh the episode comment list"
);
assert.match(
  reviewCardSource,
  /icon_chat_send_btn\.svg/,
  "the comment entry must reuse the existing send icon"
);
assert.doesNotMatch(
  reviewCardSource,
  />\s*댓글 쓰기\s*</,
  "the compact entry must not render a redundant text CTA"
);
assert.doesNotMatch(
  reviewCardSource,
  />\s*평가하기\s*</,
  "the hidden evaluation feature must not label the comment entry"
);
assert.match(
  reviewCardSource,
  /LAST_PAGE_COMMENT_PREVIEW_COUNT = 3/,
  "the last page must preview a bounded number of recent comments"
);
assert.match(
  reviewCardSource,
  /previewComments\.map/,
  "the last page must render recent comments inline"
);
assert.match(
  reviewCardSource,
  /QUICK_COMMENT_CHIPS\.map/,
  "every quick comment must stay reachable on the last page"
);
assert.doesNotMatch(
  reviewCardSource,
  /QUICK_COMMENT_CHIPS\.slice/,
  "the quick comment list must not be truncated"
);
assert.match(
  reviewCardSource,
  /aria-label="빠른 댓글 다음"/,
  "the overflowing chip row must expose an explicit forward affordance"
);
assert.match(
  reviewCardSource,
  /aria-label="빠른 댓글 이전"/,
  "the chip row must expose a backward affordance after moving forward"
);
assert.match(
  reviewCardSource,
  /canScrollChipsLeft[\s\S]*?aria-label="빠른 댓글 이전"/,
  "the backward affordance must stay hidden at the beginning of the chip row"
);
assert.match(
  reviewCardSource,
  /canScrollChipsRight[\s\S]*?aria-label="빠른 댓글 다음"/,
  "the forward affordance must disappear at the end of the chip row"
);
assert.match(
  reviewCardSource,
  /handleScrollChips\("previous"\)/,
  "the backward affordance must move toward the previous chip"
);
assert.match(
  reviewCardSource,
  /handleScrollChips\("next"\)/,
  "the forward affordance must move toward the next chip"
);
assert.match(
  reviewCardSource,
  /onScroll=\{updateChipScrollState\}/,
  "native mobile swipes must update the visible chip navigation controls"
);
assert.match(
  reviewCardSource,
  /new ResizeObserver\([\s\S]*?updateChipScrollState\(\)[\s\S]*?\)/,
  "the chip rail must be remeasured when a hidden last page becomes visible"
);
assert.match(
  reviewCardSource,
  /\.observe\(scroller\)/,
  "the resize observer must watch the actual chip rail"
);
assert.match(
  reviewCardSource,
  /\.disconnect\(\)/,
  "the chip rail resize observer must be cleaned up"
);
assert.match(
  reviewCardSource,
  /aria-label="빠른 댓글"[\s\S]{0,120}data-lastpage-interactive="true"/,
  "the entire chip rail must preserve native horizontal touch gestures"
);
assert.match(
  reviewCardSource,
  /const scrollerLeft = scroller\.getBoundingClientRect\(\)\.left;[\s\S]*?chip as HTMLElement\)\.getBoundingClientRect\(\)\.left -[\s\S]*?scrollerLeft \+[\s\S]*?currentLeft/,
  "chip positions must be normalized to the scroll rail instead of page coordinates"
);
assert.match(
  reviewCardSource,
  /chipOffsets\.find\(\(offset\) => offset > currentLeft \+ 1\)/,
  "the forward affordance must advance one chip at a time"
);
assert.match(
  reviewCardSource,
  /chipOffsets\.findLast\(\(offset\) => offset < currentLeft - 1\)/,
  "the backward affordance must return one chip at a time"
);
assert.match(
  reviewCardSource,
  /overflow-x-auto/,
  "the chip row must stay swipeable on touch devices"
);
assert.match(
  reviewCardSource,
  /\[scrollbar-width:none\].*\[&::-webkit-scrollbar\]:hidden/,
  "the horizontally scrollable chips must not expose a browser scrollbar"
);
assert.match(
  reviewCardSource,
  /handleSelectQuickComment\(quickComment\)/,
  "a last-page quick comment must fill the inline input instead of opening the overlay"
);
assert.doesNotMatch(
  reviewCardSource,
  /handleCommentState\(quickComment\)/,
  "quick comments must not navigate away from the last page"
);
assert.match(
  reviewCardSource,
  />\s*댓글 전체보기\s*</,
  "the overlay must be reachable only through an explicit see-all action"
);

// 댓글 비허용 회차는 숨기지 않고 비활성 상태로 노출한다
assert.match(
  reviewCardSource,
  /const isCommentOpen = commentOpenYn !== "N"/,
  "the last-page entry must know whether the episode accepts comments"
);
assert.match(
  reviewCardSource,
  /placeholder=\{[\s\S]*?isCommentOpen[\s\S]*?"댓글이 비허용된 상태입니다\."[\s\S]*?\}/,
  "a closed episode must explain the disabled state inside the input"
);
assert.match(
  reviewCardSource,
  /disabled=\{!isCommentOpen\}/,
  "a closed episode must disable the comment input instead of hiding it"
);
assert.match(
  reviewCardSource,
  /if \(!isCommentOpen\) return;/,
  "a closed episode must reject submission before calling the API"
);
assert.match(
  reviewCardSource,
  /disabled=\{!isCommentOpen\}[\s\S]*?\{quickComment\}/,
  "quick comment chips must be disabled on a closed episode"
);
assert.doesNotMatch(
  reviewCardSource,
  /isCommentOpen[\s\S]{0,40}previewComments\.length/,
  "a closed episode must still show its existing comments"
);
assert.match(
  lastPageSource,
  /commentOpenYn=\{viewerData\?\.data\?\.commentOpenYn\}/,
  "LastPage must forward the episode comment permission it already fetched"
);
assert.match(
  commentQuerySource,
  /enabled:\s*productId > 0 && episodeId > 0/,
  "the episode comment query must not request placeholder product or episode IDs"
);
assert.match(
  epubViewerSource,
  /aria-label=\{direction === "left" \? "이전 페이지" : "다음 페이지"\}/,
  "paginated viewer arrows must expose their direction to assistive technology"
);

// 회차 댓글 API는 publishDate만 돌려주므로 postingDate를 읽으면 항상 오늘로 표시된다
assert.doesNotMatch(
  reviewCardSource,
  /previewComment\.postingDate/,
  "the preview must not read a field the episode comment API never returns"
);
assert.match(
  reviewCardSource,
  /previewComment\.publishDate/,
  "the preview must render the real comment write date"
);

const nextEpisodeIndex = lastPageSource.indexOf("<NextEpisode");
const reviewCardIndex = lastPageSource.indexOf("<ReviewCard");
assert.ok(nextEpisodeIndex >= 0 && reviewCardIndex >= 0);
assert.ok(
  reviewCardIndex > nextEpisodeIndex,
  "the comment box must sit below the next-episode entry on the last page"
);

assert.doesNotMatch(
  viewerPageSource,
  /commentPrefill|initialComment=\{/,
  "the list-only viewer dialog must not retain a second composer prefill path"
);
assert.match(
  ratingSource,
  /\{!listOnly && \([\s\S]*?<RatingForm/,
  "the full-comment dialog must be able to omit RatingForm"
);
assert.match(
  ratingFormSource,
  /useState<string>\(initialComment\)/,
  "RatingForm must preserve prefill support for non-list-only callers"
);

// 페이지형 라스트페이지에서 좌측 화살표가 댓글 입력창을 덮으면 안 된다
assert.match(
  epubViewerSource,
  /showLastPage \? "top-\[24px\]" : "inset-y-1\/2"/,
  "the paginated back arrow must move out of the comment box on the last page"
);

// 모바일 하단 내비는 이전화/다음화를 양 끝에 두고 반응 액션을 가운데 둔다
const mobilePrevIndex = bottomNavSource.indexOf('aria-label="이전화"');
const mobileCommentIndex = bottomNavSource.indexOf('aria-label="댓글"');
const mobileNextIndex = bottomNavSource.indexOf('aria-label="다음화"');
assert.ok(
  mobilePrevIndex >= 0 && mobileCommentIndex >= 0 && mobileNextIndex >= 0,
  "mobile viewer bottom nav must keep episode navigation and comment entry"
);
assert.ok(
  mobilePrevIndex < mobileCommentIndex && mobileCommentIndex < mobileNextIndex,
  "mobile episode navigation must sit on both edges instead of one side"
);
assert.doesNotMatch(
  bottomNavSource,
  /border-l border-light-gray-500/,
  "the one-sided navigation group must not remain after the split layout"
);

// 댓글 카드는 다른 라스트페이지 카드처럼 다크 테마를 따른다
assert.match(
  reviewCardSource,
  /const isDarkTheme = settings\.theme === "dark"/,
  "the comment card must know the current viewer theme"
);
assert.doesNotMatch(
  reviewCardSource,
  /border border-line bg-white/,
  "the comment card must not hardcode a white surface"
);

// 디자인 시스템: 카드는 배경을 칠하지 않고 뷰어 테마 배경이 비치게 둔다
assert.doesNotMatch(
  reviewCardSource,
  /#2B2F35/,
  "the comment card must use design-system tokens instead of an ad-hoc dark hex"
);
assert.doesNotMatch(
  reviewCardSource,
  /(bg|border|text)-white\//,
  "the comment card must not invent an alpha palette outside the design system"
);
assert.match(
  reviewCardSource,
  /QUICK_COMMENT_CHIP_CLASS/,
  "the last-page chips must reuse the same shared style as the comment modal"
);
assert.match(
  reviewCardSource,
  /gap-8pxr overflow-x-auto/,
  "the last-page chip spacing must match the comment modal"
);
assert.match(
  read("./quickComments.ts"),
  /QUICK_COMMENT_CHIP_CLASS[\s\S]*?leading-normal/,
  "shared chips must override the EPUB container's zero line-height"
);

// 작가의 한마디가 비어 있으면 빈 카드를 남기지 않는다
assert.match(
  authorNoteSource,
  /if \(!authorComment\) return null;/,
  "an empty author note must not render an empty card on the last page"
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const ratingFormSource = readFileSync(
  new URL("../../../components/viewer/RatingForm.tsx", import.meta.url),
  "utf8"
);
const ratingSource = readFileSync(
  new URL("../../../components/viewer/Rating.tsx", import.meta.url),
  "utf8"
);
const viewerNavSource = readFileSync(
  new URL("../../../components/menu/ViewerNav.tsx", import.meta.url),
  "utf8"
);

assert.doesNotMatch(
  pageSource,
  /commentState\s*\?\s*"hidden"\s*:\s*""/,
  "opening comments must not hide the mounted EPUB viewer"
);

const epubViewerIndex = pageSource.indexOf("<EpubViewer");
const commentOverlayIndex = pageSource.indexOf('aria-label="작품 댓글"');

assert.ok(epubViewerIndex >= 0, "viewer page must render EpubViewer");
assert.ok(commentOverlayIndex >= 0, "viewer page must render the comment overlay");
assert.ok(
  commentOverlayIndex > epubViewerIndex,
  "comment overlay must render after EpubViewer so it covers the live viewer without hiding it"
);

assert.match(
  pageSource,
  /role="dialog"[\s\S]*?aria-modal="true"[\s\S]*?aria-label="작품 댓글"[\s\S]*?fixed inset-0 z-50 bg-white[\s\S]*?\{viewerNavigation\}[\s\S]*?top-\[68px\][\s\S]*?<Rating/,
  "the semantic comment dialog must contain both its navigation close control and scrollable body"
);

assert.match(
  pageSource,
  /ref=\{commentDialogRef\}[\s\S]*?role="dialog"[\s\S]*?tabIndex=\{-1\}/,
  "the comment dialog must expose a programmatic focus target"
);

assert.match(
  pageSource,
  /commentTriggerRef\.current[\s\S]*?trigger\.focus\(\)/,
  "closing comments must restore focus to the entry control"
);

assert.match(
  pageSource,
  /querySelectorAll<HTMLElement>\([\s\S]*?'button\[aria-label="댓글"\]'[\s\S]*?getClientRects\(\)\.length > 0/,
  "when an opener remounts, focus restoration must select its visible breakpoint variant"
);

assert.match(
  viewerNavSource,
  /aria-label="댓글"[\s\S]*?onClick=\{handleCommentState\}/,
  "the desktop icon-only comment opener must expose the same accessible name as mobile"
);

assert.match(
  pageSource,
  /viewerContentRef\.current[\s\S]*?viewerContent\.inert = true[\s\S]*?viewerContent\.inert = false/,
  "the retained EPUB viewer must become inert only while the comment dialog is open"
);

assert.match(
  pageSource,
  /event\.key === "Escape"[\s\S]*?querySelectorAll<HTMLElement>[\s\S]*?event\.shiftKey/,
  "the comment dialog must support Escape and contain forward and reverse tab focus"
);

assert.match(
  pageSource,
  /if \(dialog && !dialog\.contains\(document\.activeElement\)\) \{[\s\S]*?dialog\.focus\(\)/,
  "opening the list-only comment dialog must move focus into the dialog"
);

assert.match(
  pageSource,
  /<Rating[\s\S]*?listOnly/,
  "the viewer full-comment dialog must request list-only rendering"
);

assert.doesNotMatch(
  pageSource,
  /<Rating[\s\S]*?initialComment=/,
  "the viewer full-comment dialog must not forward a composer prefill"
);

assert.match(
  ratingSource,
  /listOnly[\s\S]*?\{!listOnly && \([\s\S]*?<RatingForm/,
  "list-only Rating must omit its comment composer"
);

assert.match(
  ratingSource,
  /useState\("recent"\)/,
  "the full-comment dialog must open on the same recent ordering as the last-page preview"
);

assert.match(
  viewerNavSource,
  /aria-label="댓글 닫기"/,
  "the icon-only comment close control must expose an accessible name"
);

assert.match(
  pageSource,
  /readerPaused=\{commentState\}/,
  "comment overlay must keep reader activity paused while it is open"
);

assert.match(
  pageSource,
  /commentCount=\{liveCommentCount\}/,
  "the viewer comment badge must follow the live comment list instead of the cached viewer path"
);
assert.doesNotMatch(
  pageSource,
  /invalidateQueries\(\{\s*queryKey: \["selectViewerPath"/,
  "comment activity must never invalidate the viewer path and force an EPUB refetch"
);

assert.doesNotMatch(
  ratingFormSource,
  /const\s+\{\s*data:\s*episodeData,\s*refetch\s*\}\s*=\s*useSelectViewerPath[\s\S]*?useEffect\(\(\)\s*=>\s*\{\s*refetch\(\);\s*\},\s*\[isAuthenticated\]\);/,
  "mounting the comment form must not force-refetch the viewer path and remount the EPUB reader"
);

assert.match(
  pageSource,
  /\{!noticeState && !commentState && !lastPageInView && \(/,
  "floating side menus must hide while the last page is in view so they cannot cover the comment box"
);

assert.match(
  pageSource,
  /onLastPageInViewChange=\{setLastPageInView\}/,
  "the viewer must track last-page visibility from EpubViewer"
);

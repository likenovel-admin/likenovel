import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const ratingFormSource = readFileSync(
  new URL("../../../components/viewer/RatingForm.tsx", import.meta.url),
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
  /role="dialog"[\s\S]*?aria-modal="true"[\s\S]*?aria-label="작품 댓글"[\s\S]*?fixed inset-x-0 top-\[68px\] bottom-0 z-50 overflow-y-auto overscroll-contain bg-white[\s\S]*?<Rating/,
  "comment screen must be an independently scrollable overlay below the viewer navigation"
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
  ratingFormSource,
  /if \(commentOpenYn === "N"\) return;[\s\S]*?commentInputRef\.current\?\.focus\(\)/,
  "opening comments must focus the enabled comment input even without a quick-comment prefill"
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

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
  /readerPaused=\{commentState\}/,
  "comment overlay must keep reader activity paused while it is open"
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bottomNavSource = readFileSync(
  resolve(__dirname, "ViewerBottomNav.tsx"),
  "utf8"
);
const websochatButtonSource = readFileSync(
  resolve(__dirname, "WebsochatButton.tsx"),
  "utf8"
);

assert.match(
  bottomNavSource,
  /className="flex h-full w-full items-center justify-between md:hidden"/,
  "Mobile viewer bottom nav must use a full-width grouped layout"
);

assert.match(
  bottomNavSource,
  /src="\/images\/comment\.svg"/,
  "Mobile viewer bottom nav must keep the comment icon"
);

assert.match(
  bottomNavSource,
  /label="이번 회차로 웹소챗"[\s\S]*?variant="subtle"/,
  "Desktop Websochat entry must retain the subtle variant"
);

const mobileNavStart = bottomNavSource.indexOf(
  'aria-label="뷰어 하단 메뉴"'
);
const mobileNavEnd = bottomNavSource.indexOf(
  'className="hidden disabled:cursor-not-allowed',
  mobileNavStart
);
assert.notEqual(mobileNavStart, -1, "Mobile viewer bottom nav must exist");
assert.notEqual(mobileNavEnd, -1, "Desktop viewer nav must follow mobile nav");

const mobileNavSource = bottomNavSource.slice(mobileNavStart, mobileNavEnd);
assert.match(
  mobileNavSource,
  /label="웹소챗"[\s\S]*?variant="toolbar"/,
  "Mobile Websochat must use the toolbar variant"
);
const previousEpisodeIndex = mobileNavSource.indexOf('aria-label="이전화"');
const commentActionIndex = mobileNavSource.indexOf('src="/images/comment.svg"');
const nextEpisodeIndex = mobileNavSource.indexOf('aria-label="다음화"');
assert.ok(
  previousEpisodeIndex < commentActionIndex &&
    commentActionIndex < nextEpisodeIndex,
  "Mobile episode navigation must flank the centered reaction actions"
);
assert.doesNotMatch(
  mobileNavSource,
  /border-l/,
  "The centered reaction actions must not be pushed into an episode-nav group"
);

assert.match(
  websochatButtonSource,
  /variant\?: "solid" \| "subtle" \| "toolbar"/,
  "WebsochatButton must expose the toolbar variant alongside existing variants"
);

assert.match(
  websochatButtonSource,
  /border border-primary-100 bg-white text-primary-100/,
  "Subtle WebsochatButton variant must not render as a solid primary pill"
);

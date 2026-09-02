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
  /className="flex w-full md:hidden items-center justify-between/,
  "Mobile viewer bottom nav must use a full-width grouped layout"
);

assert.match(
  bottomNavSource,
  /src="\/images\/comment\.svg"/,
  "Mobile viewer bottom nav must keep the comment icon"
);

assert.match(
  bottomNavSource,
  /variant="subtle"/,
  "Viewer bottom nav must use the toned-down Websochat variant"
);

assert.match(
  bottomNavSource,
  /label="이번 회차로 웹소챗"[\s\S]*?variant="subtle"/,
  "Desktop Websochat entry must match the mobile toned-down feel"
);

const mobileNavStart = bottomNavSource.indexOf(
  '<div className="flex w-full md:hidden'
);
const mobileNavEnd = bottomNavSource.indexOf(
  'className="hidden disabled:cursor-not-allowed',
  mobileNavStart
);
assert.notEqual(mobileNavStart, -1, "Mobile viewer bottom nav must exist");
assert.notEqual(mobileNavEnd, -1, "Desktop viewer nav must follow mobile nav");

const mobileNavSource = bottomNavSource.slice(mobileNavStart, mobileNavEnd);
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
  /variant\?: "solid" \| "subtle"/,
  "WebsochatButton must expose solid and subtle variants"
);

assert.match(
  websochatButtonSource,
  /border border-primary-100 bg-white text-primary-100/,
  "Subtle WebsochatButton variant must not render as a solid primary pill"
);

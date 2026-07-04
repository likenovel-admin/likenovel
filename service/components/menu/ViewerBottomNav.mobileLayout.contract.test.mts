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

assert.match(
  bottomNavSource,
  /border-l border-light-gray-500/,
  "Episode navigation must be visually grouped apart from reaction actions"
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

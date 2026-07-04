import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("./RatingForm.tsx", import.meta.url)),
  "utf8"
);

const chipListMatch = source.match(/const QUICK_COMMENT_CHIPS = \[([\s\S]*?)\];/);
assert.ok(chipListMatch, "quick comment chip list must be declared");
assert.match(
  source,
  /const QUICK_COMMENT_CHIP_CLASS =[\s\S]*?border-light-gray-400[\s\S]*?text-dark-gray-500[\s\S]*?hover:border-primary-100[\s\S]*?focus:ring-2 focus:ring-primary-100\/30/,
  "quick comment chips must use service design-system color tokens"
);

const chipLabels = Array.from(chipListMatch[1].matchAll(/"([^"]+)"/g)).map(
  (match) => match[1]
);
assert.equal(chipLabels.length, 10, "quick comment chip list must contain 10 labels");
assert.deepEqual(chipLabels, [
  "잘 보고 갑니다",
  "잘 읽었습니다",
  "잘 봤습니다",
  "오늘도 잘 봤습니다",
  "건필하세요",
  "작가님 화이팅",
  "응원합니다",
  "감사합니다",
  "재밌어요",
  "다음화 기다립니다",
]);

assert.match(
  source,
  /const handleSelectQuickComment = \(quickComment: string\) => \{[\s\S]*?setComment\(quickComment\);[\s\S]*?commentInputRef\.current\?\.focus\(\);[\s\S]*?\};/,
  "clicking a quick comment chip must replace the comment and focus the input"
);
assert.match(
  source,
  /overflow-x-auto[\s\S]*?md:flex-wrap/,
  "quick comment chips must be swipeable on mobile and wrap on desktop"
);
assert.match(
  source,
  /whitespace-nowrap/,
  "quick comment chips must stay on one line while swiping on mobile"
);
assert.match(
  source,
  /className=\{QUICK_COMMENT_CHIP_CLASS\}/,
  "quick comment chip buttons must reuse the design-system class"
);

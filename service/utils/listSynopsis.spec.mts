import assert from "node:assert/strict";

import {
  buildListSynopsisPreview,
  normalizeListSynopsis,
} from "./listSynopsis.ts";

assert.equal(buildListSynopsisPreview(undefined), "");
assert.equal(buildListSynopsisPreview(null), "");
assert.equal(buildListSynopsisPreview("   \n  "), "");

assert.equal(
  normalizeListSynopsis("첫 줄이다.\n\n둘째 줄이다."),
  "첫 줄이다. 둘째 줄이다."
);
assert.equal(
  normalizeListSynopsis("첫 줄이다.\\r\\n둘째 줄이다."),
  "첫 줄이다. 둘째 줄이다."
);

const shortSynopsis = "모두가 나를 환웅이라 부르기 시작했다";
assert.equal(buildListSynopsisPreview(shortSynopsis), shortSynopsis);

const longWithSentenceEnd = "가".repeat(100) + ". " + "나".repeat(100);
const clampedAtSentence = buildListSynopsisPreview(longWithSentenceEnd);
assert.equal(clampedAtSentence, "가".repeat(100) + ".");
assert.equal(clampedAtSentence.endsWith("\u2026"), false);

const longWithoutSentenceEnd = "가".repeat(400);
const clampedAtLimit = buildListSynopsisPreview(longWithoutSentenceEnd);
assert.equal(clampedAtLimit.endsWith("\u2026"), true);
assert.equal(clampedAtLimit.length, 161);

const earlySentenceEnd = "짧다. " + "다".repeat(400);
const clampedIgnoringEarlyEnd = buildListSynopsisPreview(earlySentenceEnd);
assert.equal(clampedIgnoringEarlyEnd.endsWith("\u2026"), true);
assert.ok(clampedIgnoringEarlyEnd.length > 100);

console.log("listSynopsis.spec.mts passed");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainHeaderSource = readFileSync(
  new URL("./MainHeader.tsx", import.meta.url),
  "utf8"
);
const freeTopSource = readFileSync(
  new URL("../main/FreeTop.tsx", import.meta.url),
  "utf8"
);
const paidTopSource = readFileSync(
  new URL("../main/PaidTop.tsx", import.meta.url),
  "utf8"
);
const bottomProductsSource = readFileSync(
  new URL("../main/BottomProducts.tsx", import.meta.url),
  "utf8"
);
const characterSlotSource = readFileSync(
  new URL("../main/CharacterSlot.tsx", import.meta.url),
  "utf8"
);
const cpPromotionSource = readFileSync(
  new URL("../main/CPPromotion.tsx", import.meta.url),
  "utf8"
);
const top50ProductAreaSource = readFileSync(
  new URL("../top50/ProductArea.tsx", import.meta.url),
  "utf8"
);

assert.match(mainHeaderSource, /rankingGuideMessage/);
assert.match(mainHeaderSource, /랭킹 집계 기간/);
assert.match(mainHeaderSource, /랭킹 집계 기준/);
assert.match(
  mainHeaderSource,
  /ExclamationMark/,
  "ranking guide icon should reuse the existing exclamation mark asset"
);
assert.match(
  mainHeaderSource,
  /h-\[28px\].*w-\[28px\]/s,
  "ranking guide icon should keep a 28px alignment wrapper"
);
assert.match(
  mainHeaderSource,
  /h-\[16px\].*w-\[16px\]/s,
  "ranking guide visible circle should use the existing thin tooltip icon size"
);
assert.doesNotMatch(
  mainHeaderSource,
  />\s*i\s*<\/span>/,
  "ranking guide icon should not use a raw text i"
);
assert.doesNotMatch(
  mainHeaderSource,
  /top-\[-1px\]/,
  "ranking guide icon should not need manual vertical nudging"
);
assert.doesNotMatch(mainHeaderSource, /TODO: 가이드 추가/);
assert.match(
  mainHeaderSource,
  /mobileTwoRow\?: boolean;/,
  "MainHeader should expose an opt-in mobile two-row layout",
);
assert.match(
  mainHeaderSource,
  /mobileTwoRow = false/,
  "existing MainHeader consumers should keep the one-row layout by default",
);
assert.match(
  mainHeaderSource,
  /grid-cols-\[minmax\(0,1fr\)_auto\][\s\S]*md:flex md:justify-between/,
  "the opt-in mobile header should reserve separate title and action columns",
);
assert.match(
  mainHeaderSource,
  /col-span-2 row-start-2[\s\S]*md:contents/,
  "ranking time metadata should move to a second mobile row and rejoin the desktop row",
);
assert.match(
  mainHeaderSource,
  /col-start-2 row-start-1[\s\S]*whitespace-nowrap/,
  "the mobile more action should stay on the first row without wrapping",
);
assert.match(
  mainHeaderSource,
  /flex shrink-0 items-center gap-8pxr p-2/,
  "the shared more button should never shrink inside narrow slot headers",
);
assert.match(
  mainHeaderSource,
  /compactMobileMore\?: boolean;/,
  "MainHeader should expose an opt-in compact mobile more label",
);
assert.match(
  mainHeaderSource,
  /compactMobileMore = false/,
  "non-home MainHeader consumers should keep the existing more-label size",
);
assert.match(
  mainHeaderSource,
  /compactMobileMore[\s\S]*"text-13pxr md:text-14pxr"[\s\S]*"text-14pxr"/,
  "only opted-in home slots should use the compact mobile more-label size",
);

const timeSpeechBubbleSource = readFileSync(
  new URL("./TimeSpeechBubble.tsx", import.meta.url),
  "utf8"
);
assert.match(
  timeSpeechBubbleSource,
  /inline-flex h-\[24px\] md:h-\[28px\]/,
  "time speech bubble should be a vertically centered flex control"
);
assert.match(
  timeSpeechBubbleSource,
  /showActionIndicator[\s\S]*pr-11pxr[\s\S]*md:pr-13pxr/,
  "time speech bubble should anchor the action arrow near the right edge, not float it with oversized right padding"
);
assert.match(
  timeSpeechBubbleSource,
  /ArrowRightMedium/,
  "time speech bubble action indicator should use the thin medium arrow asset"
);
assert.match(
  timeSpeechBubbleSource,
  /md:h-\[10px\] md:w-\[6px\]/,
  "time speech bubble action indicator should keep the thin arrow at a legible size"
);
assert.match(
  timeSpeechBubbleSource,
  /overflow-visible/,
  "time speech bubble action indicator should avoid clipping the arrow glyph"
);
assert.doesNotMatch(
  timeSpeechBubbleSource,
  /ArrowRightMedium[^\n]*-translate-y/,
  "time speech bubble action indicator should stay vertically centered with the time text"
);
assert.doesNotMatch(
  timeSpeechBubbleSource,
  /ml-4pxr/,
  "time speech bubble action indicator should stay close to the time text"
);
assert.doesNotMatch(
  timeSpeechBubbleSource,
  /absolute z-10 top-\[/,
  "time speech bubble content should not be positioned with absolute offsets"
);
assert.doesNotMatch(
  timeSpeechBubbleSource,
  /&gt;/,
  "time speech bubble action indicator should not use a raw text chevron"
);

assert.match(freeTopSource, /hasRankingGuide/);
assert.match(
  freeTopSource,
  /mobileTwoRow/,
  "FreeTop should opt into the stable mobile two-row header",
);
assert.match(paidTopSource, /hasRankingGuide/);
assert.match(
  paidTopSource,
  /mobileTwoRow/,
  "PaidTop should use the same stable mobile ranking-header layout",
);
for (const [name, source] of [
  ["FreeTop", freeTopSource],
  ["PaidTop", paidTopSource],
  ["BottomProducts", bottomProductsSource],
  ["CharacterSlot", characterSlotSource],
  ["CPPromotion", cpPromotionSource],
] as const) {
  assert.match(
    source,
    /compactMobileMore/,
    `${name} should opt into the compact mobile more label`,
  );
}
assert.match(
  paidTopSource,
  /timeSpeechBubbleOnClick/,
  "paid top should expose the same rank history trigger as free top"
);
assert.match(
  paidTopSource,
  /timeSpeechBubbleShowActionIndicator/,
  "paid top should show the rank history arrow indicator"
);
assert.match(
  paidTopSource,
  /area="paidSerialTop"/,
  "paid top rank history modal should query paid serial top history"
);
assert.match(top50ProductAreaSource, /hasRankingGuide/);

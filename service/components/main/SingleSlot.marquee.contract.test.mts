import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./SingleSlot.tsx", import.meta.url), "utf8");
const globals = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

assert.match(
  source,
  /const SingleSlotTitle =/,
  "SingleSlot should isolate the overflow title behavior in a small title component",
);
assert.match(
  source,
  /ResizeObserver/,
  "SingleSlot title should re-check overflow when the title area resizes",
);
assert.match(
  source,
  /scrollWidth > clientWidth/,
  "SingleSlot title should enable marquee only when the rendered title overflows",
);
assert.match(
  source,
  /single-slot-title-marquee/,
  "SingleSlot title should use the marquee class when overflow is detected",
);
assert.match(
  source,
  /absolute bottom-\[5px\] left-\[5px\]/,
  "SingleSlot UP badge should stay at the bottom-left of the cover like other home cards",
);
assert.match(
  source,
  /line-clamp-3/,
  "SingleSlot summary should show up to three lines",
);
assert.match(
  source,
  /-translate-y-\[4px\] md:-translate-y-\[8px\]/,
  "SingleSlot text block should sit slightly above vertical center",
);
assert.match(
  source,
  /aria-hidden/,
  "Duplicated marquee text should be hidden from assistive technology",
);
assert.doesNotMatch(
  source,
  /text-black-100 truncate">\s*\{product\.title\}/,
  "SingleSlot should not hard-truncate the visible title text",
);
assert.match(
  globals,
  /@keyframes single-slot-title-marquee/,
  "globals.css should define the single slot title marquee keyframes",
);
assert.match(
  globals,
  /prefers-reduced-motion:\s*reduce/,
  "SingleSlot marquee should respect reduced motion preferences",
);

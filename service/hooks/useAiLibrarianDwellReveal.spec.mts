import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./useAiLibrarianDwellReveal.ts", import.meta.url),
  "utf8"
);

assert.match(source, /AI_LIBRARIAN_DWELL_MIN_SCROLL_Y\s*=\s*120/);
assert.match(source, /shouldAllowAiLibrarianDwellRevealAtScroll/);
assert.match(
  source,
  /const canScheduleReveal = \(\) =>[\s\S]*isVisibleRef\.current[\s\S]*shouldAllowAiLibrarianDwellRevealAtScroll\(window\.scrollY\)/
);
assert.match(source, /if \(!canScheduleReveal\(\)\) \{[\s\S]*clearReveal\(\);/);
assert.match(source, /clearReveal\(\)/);

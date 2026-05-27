import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./useAiLibrarianDwellReveal.ts", import.meta.url),
  "utf8"
);

assert.match(source, /AI_LIBRARIAN_DWELL_TOP_SCROLL_Y\s*=\s*120/);
assert.match(source, /shouldPreferTopAiLibrarianDwellReveal/);
assert.doesNotMatch(source, /shouldAllowAiLibrarianDwellRevealAtScroll/);
assert.match(
  source,
  /const canScheduleReveal = \(\) =>[\s\S]*isVisibleRef\.current/
);
assert.match(
  source,
  /getBestVisibleProductId\(\s*threshold,\s*window\.scrollY\s*\)/
);
assert.match(
  source,
  /shouldPreferTopAiLibrarianDwellReveal\(scrollY\)[\s\S]*rect\.top/
);
assert.match(source, /if \(!canScheduleReveal\(\)\) \{[\s\S]*clearReveal\(\);/);
assert.match(source, /clearReveal\(\)/);

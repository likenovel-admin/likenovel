import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync("service/app/page.tsx", "utf8");
const singleSlotSource = readFileSync(
  "service/components/main/SingleSlot.tsx",
  "utf8"
);

assert.match(
  pageSource,
  /visibleMixedSections/,
  "home page must filter mixed sections by actually visible products before inserting single slots"
);
assert.doesNotMatch(
  pageSource,
  /\{mixedSections\.map/,
  "home page must not insert single slots against raw mixedSections indexes"
);
assert.match(
  pageSource,
  /secondSingleSlotAfterMixedIndex/,
  "home page must define a delayed insertion index for the second lower single slot"
);
assert.match(
  pageSource,
  /shouldRenderSecondSingleSlotAfterLatest/,
  "home page must move the second lower single slot after latest updates when there are not enough visible sections"
);
assert.match(
  singleSlotSource,
  /data-main-single-slot/,
  "SingleSlot must expose a stable DOM marker for rendered layout checks"
);
assert.match(
  pageSource,
  /data-home-section/,
  "home page must expose stable section markers for adjacency checks"
);

console.log("main single slot layout contract passed");

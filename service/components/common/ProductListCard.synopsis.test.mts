import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductListCard.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /buildListSynopsisPreview/);
assert.match(source, /from "@\/utils\/listSynopsis"/);
assert.match(
  source,
  /const listSynopsis = useMemo\(\s*\(\) => buildListSynopsisPreview\(data\.synopsis\)/
);
assert.match(source, /!isAuthorPage && !!listSynopsis && \(/);
assert.match(source, /line-clamp-2/);
assert.match(source, /line-clamp-2 text-12pxr md:text-14pxr/);
assert.doesNotMatch(source, /line-clamp-2[^"]*md:hidden/);

const serialInfoIndex = source.indexOf("총 {data.totalOpenEpisodeCount}화");
const synopsisIndex = source.indexOf("!isAuthorPage && !!listSynopsis");
const tagListIndex = source.indexOf(
  'hidden md:flex flex-wrap gap-6pxr mt-17pxr'
);
assert.ok(serialInfoIndex > 0 && synopsisIndex > 0 && tagListIndex > 0);
assert.ok(serialInfoIndex < synopsisIndex);
assert.ok(synopsisIndex < tagListIndex);

const mobileHeaderIndex = source.indexOf(
  'className="flex items-start justify-between"'
);
const mobileStatsButtonIndex = source.indexOf(
  'isMobileStatsOpen ? "통계 접기" : "통계 펼치기"'
);
const mobileTitleIndex = source.indexOf(
  'className="text-14pxr font-semibold"'
);
assert.ok(
  mobileHeaderIndex < mobileStatsButtonIndex &&
    mobileStatsButtonIndex < mobileTitleIndex
);
assert.doesNotMatch(
  source,
  /absolute bottom-\[17px\] right-\[11px\] md:hidden flex items-center gap-7pxr/
);

console.log("ProductListCard.synopsis.test.mts passed");

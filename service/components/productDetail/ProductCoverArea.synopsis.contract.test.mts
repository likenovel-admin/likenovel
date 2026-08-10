import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductCoverArea.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /line-clamp-4 md:line-clamp-5/);
assert.match(source, /data\.trendindex && !isSynopsisOpen/);
assert.match(source, /min-h-\[44px\]/);
assert.match(source, /w-full/);
assert.match(source, /\{isSynopsisOpen \? "접기" : "더보기"\}/);
assert.match(source, /aria-expanded=\{isSynopsisOpen\}/);
assert.match(source, /scrollIntoView\(\{\s*block:\s*"nearest",?\s*\}\)/);
assert.doesNotMatch(source, /top-\[99px\]/);
assert.doesNotMatch(source, /h-\[200px\]/);
assert.doesNotMatch(source, /overflow-auto/);
assert.doesNotMatch(
  source,
  /synopsisRef\.current\s*&&\s*!synopsisRef\.current\.contains/
);
assert.equal(
  source.match(/renderSynopsisText\(synopsisText\)/g)?.length,
  1,
  "소개문은 접힘/펼침 상태에서 같은 본문 노드를 재사용해야 한다"
);

console.log("ProductCoverArea synopsis contract tests passed");

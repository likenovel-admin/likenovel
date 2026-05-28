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
const top50ProductAreaSource = readFileSync(
  new URL("../top50/ProductArea.tsx", import.meta.url),
  "utf8"
);

assert.match(mainHeaderSource, /rankingGuideMessage/);
assert.match(mainHeaderSource, /랭킹 집계 기간/);
assert.match(mainHeaderSource, /랭킹 집계 기준/);
assert.match(mainHeaderSource, />i</);
assert.doesNotMatch(mainHeaderSource, /TODO: 가이드 추가/);

assert.match(freeTopSource, /hasRankingGuide/);
assert.match(paidTopSource, /hasRankingGuide/);
assert.match(top50ProductAreaSource, /hasRankingGuide/);

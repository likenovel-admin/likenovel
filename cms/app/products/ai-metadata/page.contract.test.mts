import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dtoSource = readFileSync(
  new URL("../../../api/aiProductMetadata/dto.ts", import.meta.url),
  "utf8"
);
const tableSource = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

for (const field of [
  "story_context_status",
  "story_ready_episode_no",
  "story_total_episode_count",
]) {
  assert.match(dtoSource, new RegExp(field));
}

assert.match(tableSource, /success:\s*["']DNA 성공["']/);
assert.match(tableSource, /header:\s*["']회차요약["']/);
assert.match(tableSource, /story_ready_episode_no/);
assert.match(tableSource, /story_total_episode_count/);
assert.match(tableSource, /화까지/);
assert.match(tableSource, /전체/);

assert.match(pageSource, /DNA 분석 상태/);
assert.match(pageSource, /회차요약 적재/);
assert.match(pageSource, /formatStoryContextProgress/);

console.log("AI metadata storyctx coverage contract OK");

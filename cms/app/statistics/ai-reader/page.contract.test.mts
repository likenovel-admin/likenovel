import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const targetOperationsSource = readFileSync(
  new URL("./target-operations.ts", import.meta.url),
  "utf8"
);

const targetCountIndex = pageSource.indexOf("목표 활동 인원");
const targetingIndex = pageSource.indexOf("작품 타겟팅");
const targetOperationIndex = pageSource.indexOf("{targetOperationMessage}");

assert.ok(targetCountIndex >= 0, "target active count control should exist");
assert.ok(targetingIndex >= 0, "product targeting control should be visible in the main operation card");
assert.ok(targetOperationIndex >= 0, "target operation message should exist");
assert.ok(
  targetCountIndex < targetingIndex && targetingIndex < targetOperationIndex,
  "product targeting should be shown directly under target count before the operation diff"
);

assert.match(pageSource, /onChange=\{\(e\) => handleProductTypeWeightChange\(key, e\.target\.value\)\}/);
assert.match(pageSource, /onChange=\{\(e\) => handleFreeProductTypeWeightChange\(key, e\.target\.value\)\}/);
assert.match(pageSource, /disabled=\{pendingOperation\}/);
assert.match(
  pageSource,
  /count_per_page: AI_READER_AGENT_QUERY_PAGE_SIZE/,
  "AI reader agent list query must use the backend-compatible page size"
);
assert.doesNotMatch(
  pageSource,
  /count_per_page: MAX_AI_READER_AGENT_COUNT/,
  "AI reader agent list query must not send the operational max as count_per_page"
);
assert.match(
  targetOperationsSource,
  /import \{ MAX_AI_READER_AGENT_COUNT \} from "\.\/limits"/,
  "target operations must use the operational max from limits.ts"
);
assert.doesNotMatch(
  targetOperationsSource,
  /MAX_AI_READER_AGENT_COUNT \} from "\.\/_lib"/,
  "target operations must not read the API page-size helper as the operational max"
);

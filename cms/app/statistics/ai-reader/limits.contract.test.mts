import assert from "node:assert/strict";

import {
  AI_READER_IMMEDIATE_BATCH_SIZE_CAP,
  AI_READER_TARGET_QUICK_COUNTS,
  MAX_AI_READER_AGENT_COUNT,
  getRecommendedImmediateBatchSize,
} from "./limits.ts";

assert.equal(MAX_AI_READER_AGENT_COUNT, 1000);
assert.deepEqual(AI_READER_TARGET_QUICK_COUNTS, [0, 50, 100, 500, 1000]);

assert.equal(AI_READER_IMMEDIATE_BATCH_SIZE_CAP, 100);
assert.equal(getRecommendedImmediateBatchSize(20), 20);
assert.equal(getRecommendedImmediateBatchSize(50), 10);
assert.equal(getRecommendedImmediateBatchSize(200), 20);
assert.equal(getRecommendedImmediateBatchSize(500), 50);
assert.equal(getRecommendedImmediateBatchSize(1000), 100);

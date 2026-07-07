import assert from "node:assert/strict";

import {
  AI_READER_AGENT_QUERY_PAGE_SIZE,
  defaultFreeProductTypeWeights,
  defaultPresets,
  defaultProductTypeWeights,
  getAiReaderAgentListLastPage,
  getNextAiReaderAgentIndexOffset,
  parseAiReaderAgentIndex,
  sumRatios,
} from "./_lib.ts";

assert.equal(AI_READER_AGENT_QUERY_PAGE_SIZE, 200);
assert.equal(parseAiReaderAgentIndex("ai-reader-0000"), 0);
assert.equal(parseAiReaderAgentIndex("ai-reader-0309"), 309);
assert.equal(parseAiReaderAgentIndex("reader-0309"), null);

assert.equal(getAiReaderAgentListLastPage(0), 1);
assert.equal(getAiReaderAgentListLastPage(200), 1);
assert.equal(getAiReaderAgentListLastPage(201), 2);
assert.equal(getAiReaderAgentListLastPage(310), 2);

const firstPageAgents = Array.from({ length: 200 }, (_, index) => ({
  agent_key: `ai-reader-${String(index).padStart(4, "0")}`,
}));
const lastPageAgents = Array.from({ length: 110 }, (_, index) => ({
  agent_key: `ai-reader-${String(index + 200).padStart(4, "0")}`,
}));

assert.equal(getNextAiReaderAgentIndexOffset(firstPageAgents, 310), 310);
assert.equal(
  getNextAiReaderAgentIndexOffset([...firstPageAgents, ...lastPageAgents], 310),
  310
);
assert.equal(
  getNextAiReaderAgentIndexOffset([{ agent_key: "ai-reader-0420" }], 310),
  421
);

assert.deepEqual(defaultProductTypeWeights, { free_serial: 100, paid_serial: 0 });
assert.deepEqual(defaultFreeProductTypeWeights, { normal_serial: 85, free_serial: 15 });
assert.equal(sumRatios(defaultProductTypeWeights), 100);
assert.equal(sumRatios(defaultFreeProductTypeWeights), 100);
assert.equal(defaultPresets.length, 3);
for (const preset of defaultPresets) {
  assert.deepEqual(preset.productTypeWeights, defaultProductTypeWeights);
  assert.deepEqual(preset.freeProductTypeWeights, defaultFreeProductTypeWeights);
}

import assert from "node:assert/strict";

import { parseAssistantBlocks } from "./assistantBlocks.ts";

{
  const blocks = parseAssistantBlocks("추천 기준은 [완결]이고\\n회차는 5화 이하예요.");

  assert.deepEqual(blocks, [
    {
      kind: "dialogue",
      text: "추천 기준은 [완결]이고\\n회차는 5화 이하예요.",
    },
  ]);
}

{
  const blocks = parseAssistantBlocks('그가 고개를 들었다. "여기서부터는 내가 맡지."');

  assert.deepEqual(blocks, [
    { kind: "narration", text: "그가 고개를 들었다." },
    { kind: "dialogue", text: "여기서부터는 내가 맡지." },
  ]);
}

{
  const blocks = parseAssistantBlocks('아린: "괜찮아. 아직 끝난 건 아니야."');

  assert.deepEqual(blocks, [
    { kind: "dialogue", text: "괜찮아. 아직 끝난 건 아니야." },
  ]);
}

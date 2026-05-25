import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianDetailCard.tsx", import.meta.url),
  "utf8"
);

assert.doesNotMatch(source, /websochatLaunch/);
assert.doesNotMatch(source, /useRouter/);
assert.doesNotMatch(source, /더 물어보기/);
assert.doesNotMatch(source, /AI 사서에게 더 물어보기/);
assert.doesNotMatch(source, /스포일러 없이 정리/);

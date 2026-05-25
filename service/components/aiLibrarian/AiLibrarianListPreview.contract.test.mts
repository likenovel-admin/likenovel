import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianListPreview.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /max-h-\[68px\]/);
assert.match(source, /max-h-0 pt-0/);
assert.match(source, /className = ""/);
assert.match(source, /flex flex-col gap-3pxr/);
assert.match(source, /text-10pxr leading-\[13px\][\s\S]*AI 사서/);
assert.match(source, /text-11pxr leading-\[15px\]/);
assert.match(source, /line-clamp-1/);
assert.doesNotMatch(source, /items-start gap-8pxr/);
assert.doesNotMatch(source, /pr-\[70px\]/);

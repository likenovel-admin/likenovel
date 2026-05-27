import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianListPreview.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /max-h-\[112px\]/);
assert.match(source, /max-h-0 pt-0/);
assert.match(source, /className = ""/);
assert.match(source, /flex flex-col gap-4pxr/);
assert.match(source, /text-10pxr leading-\[13px\][\s\S]*AI 사서/);
assert.match(source, /chips\?: string\[\]/);
assert.match(source, /AI_LIBRARIAN_LIST_TAG_CHIP_CLASS/);
assert.match(source, /px-6pxr py-2pxr/);
assert.match(source, /text-9pxr leading-\[12px\]/);
assert.match(source, /max-w-\[88px\]/);
assert.match(source, /className="truncate"/);
assert.doesNotMatch(source, /border-light-gray-500 bg-white px-7pxr/);
assert.doesNotMatch(source, /ONBOARDING_SELECTED_TAG_CHIP_CLASS/);
assert.doesNotMatch(source, /px-10pxr py-6pxr text-12pxr/);
assert.match(source, /text-11pxr leading-\[15px\]/);
assert.match(source, /line-clamp-1/);
assert.doesNotMatch(source, /items-start gap-8pxr/);
assert.doesNotMatch(source, /pr-\[70px\]/);

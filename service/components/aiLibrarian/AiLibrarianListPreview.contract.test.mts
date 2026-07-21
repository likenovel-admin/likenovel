import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianListPreview.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /max-h-\[184px\]/);
assert.match(source, /max-h-0 pt-0/);
assert.match(source, /className = ""/);
assert.match(source, /flex flex-col gap-6pxr/);
assert.match(source, /text-12pxr[\s\S]*leading-\[16px\][\s\S]*AI 사서/);
assert.match(source, /chips\?: string\[\]/);
assert.match(source, /onAskMore\?: \(\) => void/);
assert.match(source, /AI사서에게 더 물어보기/);
assert.match(source, /self-end/);
assert.match(source, /event\.stopPropagation\(\);[\s\S]*onAskMore\(\)/);
assert.match(source, /AI_LIBRARIAN_LIST_TAG_CHIP_CLASS/);
assert.match(source, /min-h-\[24px\]/);
assert.match(source, /px-8pxr py-2pxr/);
assert.match(source, /text-12pxr leading-\[16px\]/);
assert.match(source, /max-w-\[104px\]/);
assert.match(source, /border-light-gray-600/);
assert.match(source, /className="truncate"/);
assert.doesNotMatch(source, /border-light-gray-500 bg-white px-7pxr/);
assert.doesNotMatch(source, /ONBOARDING_SELECTED_TAG_CHIP_CLASS/);
assert.doesNotMatch(source, /px-10pxr py-6pxr text-12pxr/);
assert.match(source, /text-12pxr leading-\[18px\]/);
assert.match(source, /line-clamp-1/);
assert.match(source, /min-h-\[36px\][\s\S]*rounded-\[6px\]/);
assert.match(source, /focus-visible:ring-2/);
assert.doesNotMatch(source, /rounded-full bg-primary-100/);
assert.doesNotMatch(source, /items-start gap-8pxr/);
assert.doesNotMatch(source, /pr-\[70px\]/);

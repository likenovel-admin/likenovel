import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianListPreview.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /max-h-\[300px\]/);
assert.match(source, /max-h-0 pt-0/);
assert.match(source, /className = ""/);
assert.match(source, /flex flex-col gap-6pxr/);
assert.match(source, /text-12pxr[\s\S]*leading-\[16px\][\s\S]*AI 사서/);
assert.match(source, /chips\?: string\[\]/);
assert.match(source, /intro\?: string/);
assert.match(source, /points\?: string\[\]/);
assert.match(source, /points[\s\S]*slice\(0, 2\)/);
assert.match(source, /onAskMore\?: \(\) => void/);
assert.match(source, /AI 사서에게 묻기/);
assert.match(source, /self-end/);
assert.match(source, /mr-\[54px\]/);
assert.match(source, /md:mr-0/);
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
assert.equal([...source.matchAll(/line-clamp-3/g)].length, 2);
assert.match(source, /break-keep/);
assert.doesNotMatch(source, /line-clamp-1/);
assert.doesNotMatch(source, /line-clamp-2/);
assert.match(source, /role="list"/);
assert.match(source, /role="listitem"/);
assert.match(source, /rounded-full bg-dark-gray-300/);
assert.match(source, /border-t border-light-gray-400/);
assert.match(source, /min-h-\[36px\][\s\S]*rounded-\[6px\]/);
assert.match(
  source,
  /min-h-\[36px\][^\"]*border border-primary-100[^\"]*text-primary-100/
);
assert.match(source, /focus-visible:ring-2/);
assert.doesNotMatch(source, /rounded-full bg-primary-100/);
assert.doesNotMatch(source, /items-start gap-8pxr/);
assert.doesNotMatch(source, /pr-\[70px\]/);

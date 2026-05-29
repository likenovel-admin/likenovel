import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiLibrarianDetailCard.tsx", import.meta.url),
  "utf8"
);

assert.doesNotMatch(source, /websochatLaunch/);
assert.doesNotMatch(source, /useRouter/);
assert.match(source, /onAskMore\?: \(\) => void/);
assert.match(source, /AI사서에게 더 물어볼까요\?/);
assert.match(source, /onClick=\{onAskMore\}/);
assert.match(source, /bg-primary-100 px-10pxr py-4pxr text-11pxr/);
assert.match(source, /font-semibold leading-\[15px\] text-white/);
assert.doesNotMatch(source, /스포일러 없이 정리/);
assert.match(source, /rounded-full/);
assert.match(source, /ONBOARDING_SELECTED_TAG_CHIP_CLASS/);
assert.doesNotMatch(source, /variant="blueBorder"/);
assert.doesNotMatch(source, /min-w-\[188px\]/);
assert.doesNotMatch(source, /border-light-gray-500 bg-light-gray-100 px-9pxr/);
assert.doesNotMatch(source, /websochat/i);

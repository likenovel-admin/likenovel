import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./OnboardingModal.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /import \{ ONBOARDING_SELECTED_TAG_CHIP_CLASS \} from "\.\/tagChipStyles";/
);
assert.match(source, /className=\{ONBOARDING_SELECTED_TAG_CHIP_CLASS\}/);
assert.doesNotMatch(
  source,
  /className="inline-flex items-center gap-6pxr rounded-full border border-primary-100/
);

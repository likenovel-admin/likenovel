import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductListCard.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);
assert.match(source, /Boolean\(aiLibrarianCopy\)/);
assert.match(source, /previewLines=\{aiLibrarianCopy\.previewLines\}/);
assert.match(source, /className="hidden md:block"/);
assert.match(source, /className="md:hidden px-\[16px\]"/);
assert.match(
  source,
  /absolute bottom-\[17px\] right-\[11px\] md:hidden flex items-center gap-7pxr/
);
assert.match(
  source,
  /buttonStyle="flex items-center justify-center w-\[32px\] h-\[35px\]"/
);
assert.doesNotMatch(source, /preview=\{aiLibrarianCopy\.preview\}/);
assert.doesNotMatch(
  source,
  /absolute top-\[14px\] right-\[12px\] md:hidden/
);
assert.doesNotMatch(source, /absolute bottom-\[17px\] right-\[38px\]/);
assert.doesNotMatch(
  source,
  /buttonStyle="absolute bottom-\[17px\] right-\[11px\] p-2"/
);
assert.doesNotMatch(source, /mobilePopupPlacement="below"/);

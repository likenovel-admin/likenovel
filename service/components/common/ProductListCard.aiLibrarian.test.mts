import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./ProductListCard.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);
assert.match(source, /Boolean\(aiLibrarianCopy\)/);
assert.match(source, /previewLines=\{aiLibrarianCopy\.previewLines\}/);
assert.doesNotMatch(source, /preview=\{aiLibrarianCopy\.preview\}/);

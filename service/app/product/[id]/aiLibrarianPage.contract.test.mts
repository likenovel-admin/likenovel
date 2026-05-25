import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(source, /const aiLibrarianBrief = aiBriefsData\?\.data\?\.\[0\] \?\? null/);
assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);

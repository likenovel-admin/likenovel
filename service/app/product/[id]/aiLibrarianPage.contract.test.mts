import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(source, /const aiLibrarianBrief = aiBriefsData\?\.data\?\.\[0\] \?\? null/);
assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);
assert.match(source, /openAiLibrarianPanelOrLogin/);
assert.match(source, /requestProductQuestion/);
assert.match(source, /const shouldAskAiLibrarian = openAiLibrarianPanelOrLogin/);
assert.match(source, /const productQuestion = \{/);
assert.match(source, /pendingProductQuestion: productQuestion/);
assert.match(source, /if \(!shouldAskAiLibrarian\) return/);
assert.match(source, /requestProductQuestion\(productQuestion\)/);
assert.match(source, /이 작품 어떤 작품인지 알려줘/);
assert.match(source, /onAskMore=\{handleAskAiLibrarianMore\}/);
assert.doesNotMatch(source, /router\.push\(["']\/websochat/);

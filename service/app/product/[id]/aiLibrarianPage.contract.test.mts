import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(source, /const aiLibrarianBrief = aiBriefsData\?\.data\?\.\[0\] \?\? null/);
assert.match(source, /aiLibrarianBrief\s+\?\s+buildAiLibrarianCopy/);
assert.match(source, /openAiLibrarianPanel/);
assert.doesNotMatch(source, /openAiLibrarianPanelOrLogin/);
assert.match(source, /requestProductQuestion/);
assert.match(source, /openAiLibrarianPanel\(\{[\s\S]*setIsOpen: setAiLibrarianPanelOpen/);
assert.match(source, /const productQuestion = \{/);
assert.doesNotMatch(source, /pendingProductQuestion: productQuestion/);
assert.doesNotMatch(source, /if \(!shouldAskAiLibrarian\) return/);
assert.match(source, /requestProductQuestion\(productQuestion\)/);
assert.match(source, /이 작품 어떤 작품인지 알려줘/);
assert.match(source, /onAskMore=\{handleAskAiLibrarianMore\}/);
assert.doesNotMatch(source, /router\.push\(["']\/websochat/);

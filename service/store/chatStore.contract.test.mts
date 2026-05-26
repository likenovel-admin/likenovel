import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./chatStore.ts", import.meta.url), "utf8");

assert.match(source, /pendingProductQuestion:/);
assert.match(source, /requestProductQuestion:/);
assert.match(source, /consumePendingProductQuestion:/);
assert.match(source, /productId: number/);
assert.match(source, /prompt: string/);
assert.match(source, /set\(\{ pendingProductQuestion: payload \}\)/);
assert.match(source, /set\(\{ pendingProductQuestion: null \}\)/);

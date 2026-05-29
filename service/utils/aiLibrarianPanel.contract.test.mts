import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./aiLibrarianPanel.ts", import.meta.url),
  "utf8"
);
const openPanelOptions = source.match(
  /interface OpenAiLibrarianPanelOptions \{[\s\S]*?\n\}/
)?.[0] ?? "";

assert.match(source, /export const hasAiLibrarianAuthToken/);
assert.match(source, /export const redirectToAiLibrarianLogin/);
assert.match(source, /export const openAiLibrarianPanel/);
assert.doesNotMatch(source, /export const openAiLibrarianPanelOrLogin/);
assert.match(source, /export const queueAiLibrarianProductQuestionForLogin/);
assert.match(source, /export const consumeQueuedAiLibrarianProductQuestion/);
assert.match(source, /AI_RECOMMEND_OPEN_AFTER_LOGIN/);
assert.match(source, /AI_PENDING_PRODUCT_QUESTION/);
assert.match(source, /setIsOpen\(true\)/);
assert.match(openPanelOptions, /setIsOpen: \(isOpen: boolean\) => void/);
assert.doesNotMatch(openPanelOptions, /isAuthenticated/);
assert.doesNotMatch(openPanelOptions, /router/);
assert.doesNotMatch(openPanelOptions, /pendingProductQuestion/);
assert.doesNotMatch(source, /queueAiLibrarianProductQuestionForLogin\(pendingProductQuestion\)/);
assert.doesNotMatch(source, /redirectToAiLibrarianLogin\(router\)/);
assert.match(source, /expectedProductId\?: number/);
assert.match(source, /if \(expectedProductId && productId !== expectedProductId\) return null/);
assert.match(source, /removeLocalStorage\(STORAGE_KEYS\.AI_PENDING_PRODUCT_QUESTION\)/);
assert.match(source, /\/login\?modal=open/);
assert.doesNotMatch(source, /\/websochat/);

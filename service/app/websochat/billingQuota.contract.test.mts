import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const querySource = readFileSync(
  new URL("../api/query/websochat/index.ts", import.meta.url),
  "utf8"
);

assert.match(
  querySource,
  /sessionId[\s\S]*query\.set\("session_id", String\(sessionId\)\)/,
  "billing status should identify the active session so the backend can select its quota"
);
assert.match(
  pageSource,
  /useGetWebsochatBillingStatus\([\s\S]*activeSessionId[\s\S]*\)/,
  "the composer billing status should follow the active session"
);
assert.match(
  pageSource,
  /getWebsochatBillingStatusQueryOptions\([\s\S]*resolvedQaActionKey,[\s\S]*activeSessionId/,
  "the pre-send billing check should use the active session quota"
);
assert.doesNotMatch(
  pageSource,
  /오늘 무료 3회를 모두 썼어요/,
  "login guidance should not hard-code the regular websochat quota"
);

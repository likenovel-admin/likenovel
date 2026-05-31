import assert from "node:assert/strict";
import {
  getUserInfoQueryIdentity,
  shouldEnableUserInfoQuery,
} from "./userInfoQueryState.ts";

assert.equal(getUserInfoQueryIdentity(), "current");
assert.equal(getUserInfoQueryIdentity(0), "current");
assert.equal(getUserInfoQueryIdentity(42), "user:42");

assert.equal(shouldEnableUserInfoQuery({}), true);
assert.equal(shouldEnableUserInfoQuery({ enabled: false }), false);
assert.equal(
  shouldEnableUserInfoQuery({ requiresValidUserId: true, userId: 0 }),
  false
);
assert.equal(
  shouldEnableUserInfoQuery({ requiresValidUserId: true, userId: 42 }),
  true
);

console.log("userInfoQueryState ok");

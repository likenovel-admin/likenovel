import assert from "node:assert/strict";
import { getHomeQueryState } from "./homeQueryState.ts";

assert.deepEqual(
  getHomeQueryState({
    isAuthInitialized: false,
    isAuthenticated: false,
    accessToken: null,
    userId: null,
  }),
  {
    enabled: false,
    productCacheIdentity: "guest",
    userScopedCacheIdentity: null,
    canUseUserScopedQueries: false,
  }
);

assert.deepEqual(
  getHomeQueryState({
    isAuthInitialized: true,
    isAuthenticated: false,
    accessToken: null,
    userId: null,
  }),
  {
    enabled: true,
    productCacheIdentity: "guest",
    userScopedCacheIdentity: null,
    canUseUserScopedQueries: false,
  }
);

const tokenOnlyState = getHomeQueryState({
  isAuthInitialized: true,
  isAuthenticated: true,
  accessToken: "token-a",
  userId: null,
});

assert.equal(tokenOnlyState.enabled, true);
assert.match(tokenOnlyState.productCacheIdentity, /^token:/);
assert.equal(tokenOnlyState.userScopedCacheIdentity, null);
assert.equal(tokenOnlyState.canUseUserScopedQueries, false);

const userState = getHomeQueryState({
  isAuthInitialized: true,
  isAuthenticated: true,
  accessToken: "token-b",
  userId: 123,
});

assert.equal(userState.enabled, true);
assert.match(userState.productCacheIdentity, /^token:/);
assert.equal(userState.userScopedCacheIdentity, "user:123");
assert.equal(userState.canUseUserScopedQueries, true);

assert.notEqual(
  tokenOnlyState.productCacheIdentity,
  getHomeQueryState({
    isAuthInitialized: true,
    isAuthenticated: true,
    accessToken: "token-c",
    userId: null,
  }).productCacheIdentity
);

assert.deepEqual(
  getHomeQueryState({
    isAuthInitialized: true,
    isAuthenticated: true,
    accessToken: null,
    userId: 123,
  }),
  {
    enabled: true,
    productCacheIdentity: "user:123",
    userScopedCacheIdentity: "user:123",
    canUseUserScopedQueries: true,
  }
);

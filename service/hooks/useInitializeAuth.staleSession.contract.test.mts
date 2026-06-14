import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./useInitializeAuth.ts", import.meta.url), "utf8");

assert.match(
  source,
  /clearStaleAuthSession/,
  "useInitializeAuth should use scoped stale-auth cleanup instead of page-level fallback"
);
assert.match(
  source,
  /hasStoredAuthToken/,
  "useInitializeAuth should only clear stale auth when a browser token exists"
);
assert.match(
  source,
  /const hasToken = hasStoredAuthToken\(localStorage, sessionStorage\)/,
  "useInitializeAuth should derive auth truth from current browser tokens during server-user sync"
);
assert.match(
  source,
  /if \(data\?\.data\?\.userId && hasToken\)/,
  "cached user data without a current token should not recreate an authenticated session"
);
assert.match(
  source,
  /authorizationHeaders:\s*instance\.defaults\.headers\.common/,
  "stale-auth cleanup should remove axios default Authorization headers"
);
assert.match(
  source,
  /isAuthenticated:\s*false/,
  "stale-auth cleanup should mark the auth store as unauthenticated"
);
assert.doesNotMatch(
  source,
  /signOut\(\)/,
  "stale-auth cleanup should not call broad signOut because it clears unrelated local UX state"
);
assert.doesNotMatch(
  source,
  /sessionStorage\.clear\(\)/,
  "stale-auth cleanup should not clear all session storage"
);
assert.doesNotMatch(
  source,
  /user:\s*accessToken && storedUser \? JSON\.parse\(storedUser\) : null/,
  "initial auth hydration should not trust sessionStorage.user before server user readback"
);
assert.match(
  source,
  /user:\s*null,\s*accessToken,/,
  "initial auth hydration should wait for /query/user before exposing user-scoped state"
);

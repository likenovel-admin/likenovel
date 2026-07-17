import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const axiosSource = readFileSync(new URL("./axios/index.ts", import.meta.url), "utf8");
const authStoreSource = readFileSync(new URL("../../store/authStore.ts", import.meta.url), "utf8");
const authorHomeSource = readFileSync(
  new URL("../product/author/page.tsx", import.meta.url),
  "utf8"
);

assert.match(
  authStoreSource,
  /setRefreshToken:\s*\(newToken:\s*string\)\s*=>\s*void/,
  "auth store should expose setRefreshToken so rotated refresh tokens update in-memory state"
);
assert.match(
  authStoreSource,
  /refreshToken:\s*newToken/,
  "setRefreshToken should update the zustand refreshToken state"
);
assert.match(
  authStoreSource,
  /localStorage\.setItem\("refresh_token",\s*newToken\)/,
  "setRefreshToken should persist rotated keep-sign-in refresh tokens"
);
assert.match(
  authStoreSource,
  /sessionStorage\.setItem\("refresh_token",\s*newToken\)/,
  "setRefreshToken should persist rotated session refresh tokens"
);

assert.match(
  axiosSource,
  /setRefreshToken/,
  "axios refresh interceptor should read setRefreshToken from auth store"
);
assert.match(
  axiosSource,
  /res\?\.data\?\.data\?\.token\?\.refreshToken/,
  "axios refresh interceptor should parse backend data.token.refreshToken"
);
assert.match(
  axiosSource,
  /res\?\.data\?\.data\?\.auth\?\.refreshToken/,
  "axios refresh interceptor should keep compatibility with data.auth.refreshToken"
);
assert.match(
  axiosSource,
  /if \(newRefreshToken\) \{\s*setRefreshToken\(newRefreshToken\);\s*\}/s,
  "axios refresh interceptor should save a rotated refresh token when backend returns one"
);

const clearStaleAuthMatch = axiosSource.match(
  /const clearStaleAuth = \(\) => \{(?<body>[\s\S]*?)\n\s*\};\n\n\s*\/\/ refresh token/
);

assert.ok(
  clearStaleAuthMatch?.groups?.body,
  "axios refresh interceptor should define stale auth cleanup"
);

const clearStaleAuthBody = clearStaleAuthMatch.groups.body;

assert.match(
  clearStaleAuthBody,
  /clearStaleAuthSession/,
  "axios refresh failure should use auth-only stale session cleanup"
);
assert.match(
  clearStaleAuthBody,
  /clearAuthorizationHeaders/,
  "axios refresh failure should clear stale Authorization headers"
);
assert.match(
  axiosSource,
  /setState\(\s*\{\s*isAuthenticated:\s*false,\s*user:\s*null,\s*accessToken:\s*null,\s*refreshToken:\s*null,\s*\}\s*\)/s,
  "axios refresh failure should reset only auth store state"
);
assert.doesNotMatch(
  clearStaleAuthBody,
  /signOut\(\)/,
  "axios stale auth cleanup must not reuse explicit signOut side effects"
);
assert.doesNotMatch(
  clearStaleAuthBody,
  /recent_viewed_products/,
  "axios stale auth cleanup should preserve local recent-viewed signals"
);

const noRefreshTokenBranch = axiosSource.match(
  /\/\/ refresh token 없음(?<body>[\s\S]*?)\n\s*}\n\s*}\n\s*return Promise\.reject/
);

assert.ok(
  noRefreshTokenBranch?.groups?.body,
  "axios interceptor should keep an explicit no-refresh-token branch"
);
assert.doesNotMatch(
  noRefreshTokenBranch.groups.body,
  /window\.location\.reload\(\)/,
  "a 401 without a refresh token must not reload the protected page"
);
assert.match(
  noRefreshTokenBranch.groups.body,
  /window\.location\.href = `\/login\?redirect=\$\{currentUrl\}`/,
  "a 401 without a refresh token should redirect to login once"
);

assert.match(authorHomeSource, /isAuthInitialized/);
assert.match(authorHomeSource, /isAuthenticated/);
assert.match(
  authorHomeSource,
  /router\.replace\("\/login\?redirect=%2Fproduct%2Fauthor"/
);
const authorAuthGuardIndex = authorHomeSource.indexOf(
  "if (!isAuthInitialized || !isAuthenticated) return null;"
);
const authorProductAreaIndex = authorHomeSource.indexOf("<ProductArea />");
assert.ok(
  authorAuthGuardIndex >= 0 && authorAuthGuardIndex < authorProductAreaIndex,
  "author home must block ProductArea before authenticated queries can render"
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const axiosSource = readFileSync(new URL("./axios/index.ts", import.meta.url), "utf8");
const authStoreSource = readFileSync(new URL("../../store/authStore.ts", import.meta.url), "utf8");

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

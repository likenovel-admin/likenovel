import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authStoreSource = readFileSync(new URL("./authStore.ts", import.meta.url), "utf8");

const signOutMatch = authStoreSource.match(/signOut:\s*\(\)\s*=>\s*\{(?<body>[\s\S]*?)\n  \},\n\n  setAccessToken:/);

assert.ok(signOutMatch?.groups?.body, "auth store should expose a signOut implementation");

const signOutBody = signOutMatch.groups.body;

assert.doesNotMatch(
  signOutBody,
  /sessionStorage\.clear\s*\(/,
  "signOut must not clear all sessionStorage because analytics and funnel session keys are not auth-owned"
);
assert.match(
  signOutBody,
  /sessionStorage\.removeItem\("access_token"\)/,
  "signOut should clear session access token"
);
assert.match(
  signOutBody,
  /sessionStorage\.removeItem\("refresh_token"\)/,
  "signOut should clear session refresh token"
);
assert.match(
  signOutBody,
  /sessionStorage\.removeItem\("keep_signin_yn"\)/,
  "signOut should clear session keep-sign-in preference"
);
assert.match(
  signOutBody,
  /sessionStorage\.removeItem\("user"\)/,
  "signOut should clear cached session user"
);

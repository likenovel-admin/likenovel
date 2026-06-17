import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authStoreSource = readFileSync(new URL("./authStore.ts", import.meta.url), "utf8");

const signOutMatch = authStoreSource.match(/signOut:\s*\(\)\s*=>\s*\{(?<body>[\s\S]*?)\n  \},\n\n  setAccessToken:/);

assert.ok(signOutMatch?.groups?.body, "auth store should expose a signOut implementation");

const signOutBody = signOutMatch.groups.body;
const signInMatch = authStoreSource.match(/signIn:\s*\([\s\S]*?\)\s*=>\s*\{(?<body>[\s\S]*?)\n  \},\n\n  signOut:/);

assert.ok(signInMatch?.groups?.body, "auth store should expose a signIn implementation");

const signInBody = signInMatch.groups.body;

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
assert.match(
  authStoreSource,
  /SIGN_UP_FORM_DATA_SESSION_KEY/,
  "auth store should use the shared sensitive sign-up form data key"
);
assert.match(
  signInBody,
  /sessionStorage\.removeItem\(SIGN_UP_FORM_DATA_SESSION_KEY\)/,
  "signIn should clear sensitive sign-up form data after authentication succeeds"
);
assert.match(
  signOutBody,
  /sessionStorage\.removeItem\(SIGN_UP_FORM_DATA_SESSION_KEY\)/,
  "signOut should clear sensitive sign-up form data"
);

for (const preservedSessionKey of [
  "ln_site_pv_session_id",
  "ln_site_pv_last_key",
  "ln_site_pv_marketing_attribution",
  "funnel_route_state",
]) {
  assert.doesNotMatch(
    signOutBody,
    new RegExp(`sessionStorage\\.removeItem\\("${preservedSessionKey}"\\)`),
    `signOut should preserve non-auth session key ${preservedSessionKey}`
  );
}

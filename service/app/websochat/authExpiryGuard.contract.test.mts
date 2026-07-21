import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const authStoreSource = readFileSync(
  new URL("../../store/authStore.ts", import.meta.url),
  "utf8"
);
const storageRelaySource = readFileSync(
  new URL("../storage-relay/page.tsx", import.meta.url),
  "utf8"
);
const loginSource = readFileSync(
  new URL("../../components/login/index.tsx", import.meta.url),
  "utf8"
);

assert.match(
  pageSource,
  /shouldRequireReauthentication\([\s\S]*hasExpiredAuthSession\(window\.sessionStorage\)/,
  "websochat should distinguish expired account auth from a fresh guest visit"
);
assert.match(
  pageSource,
  /const websochatGuestKey = shouldRedirectExpiredWebsochatAuth[\s\S]*\? null/,
  "expired account auth must not fall through to the guest actor"
);
assert.match(
  pageSource,
  /localStorage\.setItem\(STORAGE_KEYS\.PREVIOUS_PAGE, returnPath\)[\s\S]*window\.location\.replace\(`\/login\?redirect=\$\{encodeURIComponent\(returnPath\)\}`\)/,
  "expired websochat auth should preserve the current path and move to login"
);
assert.match(
  pageSource,
  /shouldRedirectExpiredWebsochatAuth[\s\S]*isSendButtonDisabled/,
  "composer should be disabled while expired auth redirects"
);
const signInBody = authStoreSource.match(
  /signIn:\s*\([\s\S]*?\)\s*=>\s*\{(?<body>[\s\S]*?)\n  \},\n\n  signOut:/
)?.groups?.body;
const signOutBody = authStoreSource.match(
  /signOut:\s*\(\)\s*=>\s*\{(?<body>[\s\S]*?)\n  \},\n\n  setAccessToken:/
)?.groups?.body;
assert.match(
  signInBody || "",
  /clearExpiredAuthSessionMarker\(sessionStorage\)/,
  "successful login should clear the expiry marker"
);
assert.match(
  signOutBody || "",
  /clearExpiredAuthSessionMarker\(sessionStorage\)/,
  "explicit logout should clear the expiry marker so fresh guest use remains available"
);
assert.match(
  storageRelaySource,
  /STORAGE_KEYS\.PREVIOUS_PAGE[\s\S]*removeLocalStorage\(STORAGE_KEYS\.PREVIOUS_PAGE\)[\s\S]*router\.push\(previousPage \|\| "\/"\)/,
  "social login relay should return to the saved protected page"
);
assert.match(
  loginSource,
  /redirectUrl\?\.startsWith\("\/"\)[\s\S]*!redirectUrl\.startsWith\("\/\/"\)[\s\S]*setLocalStorage\(STORAGE_KEYS\.PREVIOUS_PAGE, redirectUrl\)/,
  "social login should preserve only an internal redirect before leaving the site"
);
assert.equal(
  (loginSource.match(/onBeforeRedirect=\{prepareSocialLoginRedirect\}/g) || []).length,
  3,
  "naver, kakao, and google login should share the protected-page return path"
);

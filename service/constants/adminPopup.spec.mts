import assert from "node:assert/strict";
import {
  ADMIN_POPUP_QUERY_API_PATH,
  ADMIN_POPUP_QUERY_PATH,
  ADMIN_POPUP_PRELOAD_SCRIPT_ID,
  ADMIN_POPUP_PRELOAD_TIMEOUT_MS,
  ADMIN_POPUP_PRELOAD_WINDOW_KEY,
  ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE,
  buildAdminPopupPreloadScript,
  shouldFetchAdminPopup,
} from "./adminPopup.ts";

assert.equal(ADMIN_POPUP_QUERY_PATH, "/v1/query/popup");
assert.equal(ADMIN_POPUP_QUERY_API_PATH, "/api/v1/query/popup");
assert.equal(shouldFetchAdminPopup("/"), true);
assert.equal(shouldFetchAdminPopup("/product/123"), false);
assert.equal(shouldFetchAdminPopup(null), false);
assert.equal(ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE, false);
assert.equal(ADMIN_POPUP_PRELOAD_WINDOW_KEY, "__likenovelAdminPopupPreload");
assert.equal(ADMIN_POPUP_PRELOAD_SCRIPT_ID, "admin-popup-preload");
assert.equal(ADMIN_POPUP_PRELOAD_TIMEOUT_MS, 2500);

const preloadScript = buildAdminPopupPreloadScript();
assert.ok(preloadScript.includes('location.pathname !== "/"'));
assert.ok(preloadScript.includes("/api/v1/query/popup"));
assert.ok(preloadScript.includes("__likenovelAdminPopupPreload"));
assert.ok(preloadScript.includes('credentials: "same-origin"'));
assert.ok(preloadScript.includes("consumed: false"));

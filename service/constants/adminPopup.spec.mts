import assert from "node:assert/strict";
import {
  ADMIN_POPUP_QUERY_API_PATH,
  ADMIN_POPUP_QUERY_PATH,
  ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE,
  shouldFetchAdminPopup,
} from "./adminPopup.ts";

assert.equal(ADMIN_POPUP_QUERY_PATH, "/v1/query/popup");
assert.equal(ADMIN_POPUP_QUERY_API_PATH, "/api/v1/query/popup");
assert.equal(shouldFetchAdminPopup("/"), true);
assert.equal(shouldFetchAdminPopup("/product/123"), false);
assert.equal(shouldFetchAdminPopup(null), false);
assert.equal(ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE, false);

import assert from "node:assert/strict";
import {
  clearStaleAuthSession,
  hasStoredAuthToken,
} from "./authSession.ts";

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  let clearCount = 0;

  return {
    get clearCount() {
      return clearCount;
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      clearCount += 1;
      values.clear();
    },
  };
};

{
  const local = createMemoryStorage();
  const session = createMemoryStorage();
  const headers: Record<string, string> = {
    Authorization: "Bearer stale",
    authorization: "Bearer stale-lower",
    "Content-Type": "application/json",
  };

  local.setItem("access_token", "local-access");
  local.setItem("refresh_token", "local-refresh");
  local.setItem("keep_signin_yn", "Y");
  local.setItem("recent_viewed_products", "[1106]");
  session.setItem("access_token", "session-access");
  session.setItem("refresh_token", "session-refresh");
  session.setItem("user", JSON.stringify({ userId: 1086 }));
  session.setItem(
    "formData",
    JSON.stringify({ email: "user@example.com", password: "secret" })
  );
  session.setItem("ln_site_pv_session_id", "pv_session_1");
  session.setItem("ln_site_pv_last_key", "/product/1106");
  session.setItem("ln_site_pv_marketing_attribution", JSON.stringify({ source: "ad" }));
  session.setItem("funnel_route_state", JSON.stringify({ path: "/product/1106" }));

  assert.equal(hasStoredAuthToken(local, session), true);

  clearStaleAuthSession({
    localStorage: local,
    sessionStorage: session,
    authorizationHeaders: headers,
  });

  assert.equal(local.getItem("access_token"), null);
  assert.equal(local.getItem("refresh_token"), null);
  assert.equal(session.getItem("access_token"), null);
  assert.equal(session.getItem("refresh_token"), null);
  assert.equal(session.getItem("user"), null);
  assert.equal(session.getItem("formData"), null);
  assert.equal(headers.Authorization, undefined);
  assert.equal(headers.authorization, undefined);
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(local.getItem("keep_signin_yn"), "Y");
  assert.equal(local.getItem("recent_viewed_products"), "[1106]");
  assert.equal(session.getItem("ln_site_pv_session_id"), "pv_session_1");
  assert.equal(session.getItem("ln_site_pv_last_key"), "/product/1106");
  assert.equal(
    session.getItem("ln_site_pv_marketing_attribution"),
    JSON.stringify({ source: "ad" })
  );
  assert.equal(session.getItem("funnel_route_state"), JSON.stringify({ path: "/product/1106" }));
  assert.equal(local.clearCount, 0);
  assert.equal(session.clearCount, 0);
  assert.equal(hasStoredAuthToken(local, session), false);
}

{
  const local = createMemoryStorage();
  const session = createMemoryStorage();

  assert.equal(hasStoredAuthToken(local, session), false);
  session.setItem("refresh_token", "session-refresh");
  assert.equal(hasStoredAuthToken(local, session), true);
}

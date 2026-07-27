import assert from "node:assert/strict";
import {
  SITE_ANALYTICS_SESSION_ID_KEY,
  SITE_ANALYTICS_VISITOR_ID_KEY,
  getSiteAnalyticsIdentity,
} from "./siteAnalyticsIdentity.ts";

const createStorage = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  } as Storage;
};

{
  const local = createStorage();
  const session = createStorage();
  const identity = getSiteAnalyticsIdentity({ local, session });

  assert.match(identity.visitorId, /^pv_/);
  assert.match(identity.browserSessionId, /^pvs_/);
  assert.equal(local.getItem(SITE_ANALYTICS_VISITOR_ID_KEY), identity.visitorId);
  assert.equal(
    session.getItem(SITE_ANALYTICS_SESSION_ID_KEY),
    identity.browserSessionId
  );
}

{
  const identity = getSiteAnalyticsIdentity({
    local: createStorage({
      [SITE_ANALYTICS_VISITOR_ID_KEY]: "pv_existing",
    }),
    session: createStorage({
      [SITE_ANALYTICS_SESSION_ID_KEY]: "pvs_existing",
    }),
  });

  assert.deepEqual(identity, {
    visitorId: "pv_existing",
    browserSessionId: "pvs_existing",
  });
}

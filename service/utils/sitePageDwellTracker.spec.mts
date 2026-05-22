import assert from "node:assert/strict";
import {
  buildSitePageDwellPayload,
  normalizeSitePageDwellActiveMs,
  shouldTrackSitePageDwellPath,
} from "./sitePageViewTaxonomy.ts";
import {
  getNextKstMidnightDelayMs,
  resumeSitePageDwellVisibleWindow,
} from "./sitePageDwellTiming.ts";

assert.equal(
  shouldTrackSitePageDwellPath("/viewer/22051"),
  true,
  "viewer routes should collect active dwell"
);

assert.equal(
  shouldTrackSitePageDwellPath("/product/1129"),
  true,
  "product detail routes should collect active dwell"
);

assert.equal(
  shouldTrackSitePageDwellPath("/login"),
  false,
  "auth routes should not collect dwell"
);

assert.equal(
  shouldTrackSitePageDwellPath("/product/mypage/cash"),
  false,
  "mypage/payment routes should not collect dwell"
);

assert.equal(
  shouldTrackSitePageDwellPath("/unknown-sensitive-route"),
  false,
  "unknown raw paths should not collect dwell"
);

assert.equal(normalizeSitePageDwellActiveMs(999), null);
assert.equal(normalizeSitePageDwellActiveMs(1000), 1000);
assert.equal(normalizeSitePageDwellActiveMs(31 * 60 * 1000), 30 * 60 * 1000);

const payload = buildSitePageDwellPayload({
  pathname: "/viewer/22051",
  visitorId: "pv_visitor",
  sessionId: "pvs_session",
  eventId: "9e6c64d6-9222-4546-a7ef-8699f89e2d26",
  occurredAt: "2026-05-23T12:00:00.000+09:00",
  activeMs: 12_345,
});

assert.deepEqual(payload, {
  eventId: "9e6c64d6-9222-4546-a7ef-8699f89e2d26",
  occurredAt: "2026-05-23T12:00:00.000+09:00",
  visitorId: "pv_visitor",
  sessionId: "pvs_session",
  routeGroup: "viewer",
  routeName: "viewer_episode",
  pathTemplate: "/viewer/[id]",
  activeMs: 12_345,
  source: "service-web",
  taxonomyVersion: 1,
});

assert.equal(
  Object.prototype.hasOwnProperty.call(payload ?? {}, "path"),
  false,
  "dwell payload should not send raw path"
);

const hiddenBeforeMidnightTiming = {
  startedAt: Date.parse("2026-05-22T14:59:50.000Z"),
  visibleStartedAt: null,
};
const visibleAfterMidnight = Date.parse("2026-05-22T15:00:10.000Z");

resumeSitePageDwellVisibleWindow(hiddenBeforeMidnightTiming, visibleAfterMidnight);

assert.equal(
  hiddenBeforeMidnightTiming.startedAt,
  visibleAfterMidnight,
  "resumed visible dwell should start a new occurrence window"
);
assert.equal(
  hiddenBeforeMidnightTiming.visibleStartedAt,
  visibleAfterMidnight,
  "resumed visible dwell should start active accumulation from now"
);

assert.equal(
  getNextKstMidnightDelayMs(Date.parse("2026-05-22T14:59:50.000Z")),
  10_000,
  "KST midnight flush should split a visible dwell window at the daily boundary"
);
assert.equal(
  getNextKstMidnightDelayMs(Date.parse("2026-05-22T15:00:00.000Z")),
  24 * 60 * 60 * 1000,
  "exact KST midnight should schedule the next daily boundary"
);

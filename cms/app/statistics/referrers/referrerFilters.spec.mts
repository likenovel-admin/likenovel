import assert from "node:assert/strict";

import {
  defaultReferrerSortBy,
  defaultTrafficSignal,
  formatReferrerDateTime,
  getReferrerGroupCompatibilityHint,
  isReferrerGroupDisabledForTrafficSignal,
  normalizeReferrerGroupForTrafficSignal,
  referrerSortOptions,
  trafficSignalOptions,
} from "./referrerFilters.ts";

assert.equal(defaultTrafficSignal, "tracked");
assert.equal(defaultReferrerSortBy, "last_seen_at");
assert.equal(trafficSignalOptions[0]?.value, "tracked");
assert.equal(referrerSortOptions[0]?.value, "last_seen_at");
assert.equal(formatReferrerDateTime("2026-05-27T18:30:00"), "2026-05-27 18:30");
assert.equal(formatReferrerDateTime(null), "-");
assert.equal(isReferrerGroupDisabledForTrafficSignal("direct", "tracked"), true);
assert.equal(isReferrerGroupDisabledForTrafficSignal("internal", "utm"), true);
assert.equal(isReferrerGroupDisabledForTrafficSignal("unknown", "external"), true);
assert.equal(isReferrerGroupDisabledForTrafficSignal("direct", "all"), false);
assert.equal(isReferrerGroupDisabledForTrafficSignal("unknown", "unknown"), false);
assert.equal(isReferrerGroupDisabledForTrafficSignal("instagram", "tracked"), false);
assert.equal(normalizeReferrerGroupForTrafficSignal("direct", "tracked"), "all");
assert.equal(normalizeReferrerGroupForTrafficSignal("internal", "external"), "all");
assert.equal(normalizeReferrerGroupForTrafficSignal("unknown", "unknown"), "unknown");
assert.equal(normalizeReferrerGroupForTrafficSignal("instagram", "utm"), "instagram");
assert.equal(
  getReferrerGroupCompatibilityHint("tracked"),
  "직접/내부/미분류는 유입 신호 '전체' 또는 '미분류'에서 확인할 수 있습니다."
);
assert.equal(getReferrerGroupCompatibilityHint("all"), null);

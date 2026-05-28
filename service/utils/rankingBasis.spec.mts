import assert from "node:assert/strict";
import {
  formatRankBasisTime,
  getFormattedRankBasisTime,
  getRankBasisDate,
} from "./rankingBasis.ts";

assert.equal(
  getFormattedRankBasisTime(new Date(2026, 4, 29, 2, 45, 12)),
  "2026. 05. 29 02:30"
);

assert.equal(
  getFormattedRankBasisTime(new Date(2026, 4, 29, 2, 5, 12)),
  "2026. 05. 29 01:30"
);

assert.equal(
  getFormattedRankBasisTime(new Date(2026, 4, 29, 0, 10, 0)),
  "2026. 05. 28 23:30"
);

const basis = getRankBasisDate(new Date(2026, 4, 29, 2, 45, 12));
assert.equal(basis.getSeconds(), 0);
assert.equal(basis.getMilliseconds(), 0);
assert.equal(formatRankBasisTime(basis), "2026. 05. 29 02:30");

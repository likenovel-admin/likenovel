import assert from "node:assert/strict";
import { buildEpisodeSummaryLabel } from "./episodeSummaryLabel.ts";

assert.equal(
  buildEpisodeSummaryLabel({
    totalEpisodeCount: 74,
    productPriceType: "paid",
    paidEpisodeNo: 26,
  }),
  "총 74화 (1~25화 무료 · 이후 유료)"
);

assert.equal(
  buildEpisodeSummaryLabel({
    totalEpisodeCount: 74,
    productPriceType: "free",
    paidEpisodeNo: null,
  }),
  "총 74화"
);

assert.equal(
  buildEpisodeSummaryLabel({
    totalEpisodeCount: 12,
    productPriceType: "paid",
    paidEpisodeNo: 1,
  }),
  "총 12화 (전 회차 유료)"
);

assert.equal(
  buildEpisodeSummaryLabel({
    totalEpisodeCount: 12,
    productPriceType: "paid",
    paidEpisodeNo: null,
  }),
  "총 12화"
);

assert.equal(
  buildEpisodeSummaryLabel({
    totalEpisodeCount: 0,
    productPriceType: "free",
    paidEpisodeNo: null,
  }),
  "총 0화"
);

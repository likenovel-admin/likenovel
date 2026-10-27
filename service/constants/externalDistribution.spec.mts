import assert from "node:assert/strict";

import {
  buildExternalDistributionDescription,
  buildExternalDistributionPath,
  isExternalDistributionPlatform,
  parseExternalDistributionPlatform,
} from "./externalDistribution.ts";

assert.equal(isExternalDistributionPlatform("kakaopage"), true);
assert.equal(isExternalDistributionPlatform("ridi"), true);
assert.equal(isExternalDistributionPlatform("toString"), false);
assert.equal(isExternalDistributionPlatform(undefined), false);

assert.equal(parseExternalDistributionPlatform("ridi"), "ridi");
assert.equal(parseExternalDistributionPlatform("naver"), "kakaopage");
assert.equal(parseExternalDistributionPlatform(null), "kakaopage");

assert.equal(
  buildExternalDistributionPath("ridi"),
  "/product/external-distribution?platform=ridi"
);
assert.equal(
  buildExternalDistributionDescription("kakaopage", 50),
  "라이크노벨에서 50화 이상 유료 연재한 작품은 카카오페이지에서도 연재돼요."
);

console.log("externalDistribution constants ok");

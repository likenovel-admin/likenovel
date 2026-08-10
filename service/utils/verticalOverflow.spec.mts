import assert from "node:assert/strict";

import { isVerticallyOverflowing } from "./verticalOverflow.ts";

assert.equal(
  isVerticallyOverflowing({ clientHeight: 45, scrollHeight: 68 }),
  true,
  "글자 수와 무관하게 실제 높이가 clamp 높이를 넘으면 더보기가 필요하다"
);

assert.equal(
  isVerticallyOverflowing({ clientHeight: 45, scrollHeight: 45 }),
  false,
  "실제 높이가 clamp 높이 안이면 더보기가 필요하지 않다"
);

assert.equal(
  isVerticallyOverflowing({ clientHeight: 45, scrollHeight: 46 }),
  false,
  "1px 반올림 차이는 실제 overflow로 취급하지 않는다"
);

console.log("verticalOverflow tests passed");

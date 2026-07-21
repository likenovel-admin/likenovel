import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWebsochatModelUsageHint,
  resolveWebsochatModelOption,
  resolveWebsochatModelOptions,
} from "./websochatModelSelection.ts";

const modelOptions = [
  {
    modelKey: "speed" as const,
    displayName: "스피드",
    cashCostPerMessage: 20,
    freeRemainingMessages: 10,
    dailyFreeMessageLimit: 10,
  },
  {
    modelKey: "balance" as const,
    displayName: "밸런스",
    cashCostPerMessage: 25,
    freeRemainingMessages: 5,
    dailyFreeMessageLimit: 5,
  },
  {
    modelKey: "deep" as const,
    displayName: "딥",
    cashCostPerMessage: 35,
    freeRemainingMessages: 0,
    dailyFreeMessageLimit: 1,
  },
];

test("서버 모델 옵션과 현재 선택을 그대로 사용한다", () => {
  assert.equal(resolveWebsochatModelOption(modelOptions, "balance")?.displayName, "밸런스");
  assert.equal(buildWebsochatModelUsageHint(modelOptions[1]), "무료 5회");
  assert.equal(buildWebsochatModelUsageHint(modelOptions[2]), "35C");
});

test("구버전 응답은 서버가 준 기존 과금값으로 스피드 한 개만 구성한다", () => {
  assert.deepEqual(
    resolveWebsochatModelOptions({
      cashCostPerMessage: 20,
      freeRemainingMessages: 3,
      dailyFreeMessageLimit: 3,
    }),
    [
      {
        modelKey: "speed",
        displayName: "스피드",
        cashCostPerMessage: 20,
        freeRemainingMessages: 3,
        dailyFreeMessageLimit: 3,
      },
    ]
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8"
);
const dtoSource = readFileSync(
  new URL("../../../api/statistic/dto.ts", import.meta.url),
  "utf8"
);

assert.match(pageSource, /Provider 물리 호출 원장/);
assert.match(pageSource, /provider_attempt_summary/);
assert.match(pageSource, /provider_attempts/);
assert.match(pageSource, /기존 기능 로그와 아래 물리 호출 원장은 집계 단위가 달라 서로 합산하지 않습니다/);
assert.match(pageSource, /조회 날짜는 한국 시간 기준입니다/);
assert.match(dtoSource, /provider_attempt_summary\?: IStatisticAiProviderAttemptSummary/);
assert.match(dtoSource, /provider_attempts\?: IStatisticAiProviderAttempt\[\]/);

console.log("ai api provider usage contract: ok");

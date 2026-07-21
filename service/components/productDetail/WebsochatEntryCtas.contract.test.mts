import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./WebsochatEntryCtas.tsx", import.meta.url), "utf8");

test("작품 상세의 일반 채팅 CTA는 구형 인물 대화 모드를 무작위로 시작하지 않는다", () => {
  const poolStart = source.indexOf("export const WEBSOCHAT_ENTRY_CTA_POOL");
  const poolEnd = source.indexOf("interface Props", poolStart);
  const poolSource = source.slice(poolStart, poolEnd);

  assert.ok(poolStart >= 0 && poolEnd > poolStart);
  assert.doesNotMatch(poolSource, /modeKey:\s*"rp"/);
  assert.doesNotMatch(poolSource, /label:\s*"인물과 대화"/);
});

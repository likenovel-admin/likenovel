import assert from "node:assert/strict";
import test from "node:test";

import { resolveWebsochatStartSurface } from "./websochatStart.ts";

const blankState = {
  isPreparingNewSession: false,
  actorReady: true,
  sessionsReady: true,
  sessionCount: 0,
  activeSessionId: null,
  selectedProductId: null,
  hasSelectedProductSnapshot: false,
  hasPendingWebsochatLaunch: false,
  hasPendingCharacterLaunch: false,
  isCreatingCharacterSession: false,
  hasPendingSessionPreview: false,
};

test("세션 조회가 끝난 빈 진입과 명시적 새 대화에서만 시작 화면을 연다", () => {
  assert.equal(resolveWebsochatStartSurface(blankState), "chooser");
  assert.equal(
    resolveWebsochatStartSurface({
      ...blankState,
      actorReady: false,
      sessionsReady: false,
      isPreparingNewSession: true,
    }),
    "chooser"
  );
  assert.equal(
    resolveWebsochatStartSurface({ ...blankState, sessionsReady: false }),
    "loading"
  );
});

test("기존 세션과 작품 또는 캐릭터 직접 진입은 시작 화면을 건너뛴다", () => {
  assert.equal(
    resolveWebsochatStartSurface({ ...blankState, activeSessionId: 2184 }),
    "content"
  );
  assert.equal(
    resolveWebsochatStartSurface({ ...blankState, selectedProductId: 1103 }),
    "content"
  );
  assert.equal(
    resolveWebsochatStartSurface({
      ...blankState,
      hasPendingWebsochatLaunch: true,
    }),
    "content"
  );
  assert.equal(
    resolveWebsochatStartSurface({
      ...blankState,
      hasPendingCharacterLaunch: true,
    }),
    "content"
  );
});

test("서버 세션 복원 전에는 chooser나 구형 composer 대신 로딩을 유지한다", () => {
  assert.equal(
    resolveWebsochatStartSurface({ ...blankState, sessionCount: 1 }),
    "loading"
  );
  assert.equal(
    resolveWebsochatStartSurface({
      ...blankState,
      actorReady: false,
      sessionsReady: false,
    }),
    "loading"
  );
});

test("세션 조회 실패는 무한 로딩 대신 재시도 화면으로 분리한다", () => {
  assert.equal(
    resolveWebsochatStartSurface({
      ...blankState,
      sessionsReady: false,
      sessionsFailed: true,
    }),
    "error"
  );
});

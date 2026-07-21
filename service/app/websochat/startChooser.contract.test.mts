import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("빈 새 대화는 공개 캐릭터 목록과 시작 선택 화면을 연결한다", () => {
  assert.match(source, /useGetMainCharacterSlots\(/);
  assert.match(source, /resolveWebsochatStartSurface\(\{/);
  assert.match(source, /<WebsochatStartChooser/);
  assert.match(source, /onChooseWebsochat=\{\(\) => setIsProductPickerOpen\(true\)\}/);
  assert.match(source, /onChooseCharacterChat=\{\(\) => setWebsochatStartView\("character_picker"\)\}/);
});

test("주인공 선택은 고정 캐릭터챗 요청으로 기존 생성 경로를 사용한다", () => {
  const start = source.indexOf("const handleLaunchStartCharacter");
  const end = source.indexOf("const openLoginConfirm", start);
  const handlerSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(handlerSource, /buildHomeCharacterChatSessionRequest\(\{/);
  assert.match(handlerSource, /characterScopeKey:\s*item\.characterScopeKey/);
  assert.match(handlerSource, /entrySource:\s*"websochat_rp_mode"/);
  assert.match(handlerSource, /startPendingHomeCharacterLaunch\(launch\)/);
});

test("선택 화면에서는 작품 정보와 입력창을 함께 숨긴다", () => {
  assert.match(
    source,
    /shouldHoldNewChatStartSurface \? null : activeSessionId && !canSendMessage/
  );
});

test("세션 복원 중에는 로딩만 표시하고 조회 실패는 재시도할 수 있다", () => {
  assert.match(source, /sessionCount:\s*sessionsData\?\.data\?\.length \?\? 0/);
  assert.match(source, /websochatStartSurface === "loading"/);
  assert.match(source, /websochatStartSurface === "error"/);
  assert.match(source, /onClick=\{\(\) => void refetchSessions\(\)\}/);
});

test("일반 응답 액션에서도 구형 인물 대화를 필터링한다", () => {
  const start = source.indexOf("const renderWebsochatActionCards");
  const end = source.indexOf("const renderWebsochatCtaCards", start);
  const rendererSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(rendererSource, /isVisibleWebsochatPublicShortcutAction\(action\)/);
});

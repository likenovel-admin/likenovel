import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const globalNavSource = readFileSync(
  new URL("../../components/menu/GlobalNav.tsx", import.meta.url),
  "utf8"
);
const mobileGlobalNavSource = readFileSync(
  new URL("../../components/menu/MobileGlobalNav.tsx", import.meta.url),
  "utf8"
);
const websochatQuerySource = readFileSync(
  new URL("../api/query/websochat/index.ts", import.meta.url),
  "utf8"
);

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

test("성공한 세션 데이터의 background refetch는 시작 화면을 로딩으로 되돌리지 않는다", () => {
  const start = source.indexOf("const sessionsReadyForStartSurface");
  const end = source.indexOf("const websochatStartSurface", start);
  const readinessSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(readinessSource, /isSessionsFetching/);
});

test("PC와 모바일 내비바의 웹소챗 진입은 same-path 포함 chooser를 요청한다", () => {
  for (const navSource of [globalNavSource, mobileGlobalNavSource]) {
    const start = navSource.indexOf("const navigate");
    const end = navSource.indexOf("const handleLoginNeeded", start);
    const navigateSource = navSource.slice(start, end);
    const websochatBranch = navigateSource.indexOf('if (href === "/websochat")');
    const samePathReturn = navigateSource.indexOf("if (href === pathname) return");
    const clearPendingCharacterLaunch = navigateSource.indexOf(
      "clearPendingHomeCharacterChatLaunch()"
    );
    const requestStartChooser = navigateSource.indexOf(
      "requestWebsochatStartChooser()"
    );

    assert.ok(start >= 0 && end > start);
    assert.ok(websochatBranch >= 0 && samePathReturn > websochatBranch);
    assert.ok(
      clearPendingCharacterLaunch >= 0
        && requestStartChooser > clearPendingCharacterLaunch
    );
    assert.match(navigateSource, /requestWebsochatStartChooser\(\)/);
    assert.match(
      navigateSource,
      /window\.dispatchEvent\(new Event\(WEBSOCHAT_START_CHOOSER_EVENT\)\)/
    );
  }
});

test("웹소챗 페이지는 mount one-shot과 same-page 이벤트를 같은 새 대화 진입으로 처리한다", () => {
  assert.match(
    source,
    /useBrowserLayoutEffect\(\(\) => \{\s+if \(!consumeWebsochatStartChooserRequest\(\)\) return;\s+enterDraftSession\(false\);/
  );
  assert.match(
    source,
    /window\.addEventListener\(\s*WEBSOCHAT_START_CHOOSER_EVENT,\s*handleStartChooser\s*\)/
  );
  assert.match(
    source,
    /const handleStartChooser = \(\) => \{\s+consumeWebsochatStartChooserRequest\(\);\s+enterDraftSession\(false\);/
  );
});

test("mount 캐릭터 launch는 navbar가 pending key를 지운 경우 생성 전에 반환한다", () => {
  assert.match(
    source,
    /const launch = consumePendingHomeCharacterChatLaunch\(\);\s+if \(!launch\) return;[\s\S]+startPendingHomeCharacterLaunch\(launch\);/
  );
});

test("chooser 전환은 진행 중 캐릭터 세션 생성을 취소하고 late result 소유권을 무효화한다", () => {
  const launchStart = source.indexOf("const startPendingHomeCharacterLaunch");
  const launchEnd = source.indexOf("useBrowserLayoutEffect(() => {", launchStart);
  const launchSource = source.slice(launchStart, launchEnd);
  const draftStart = source.indexOf("const enterDraftSession");
  const draftEnd = source.indexOf("useEffect(() => {", draftStart);
  const draftSource = source.slice(draftStart, draftEnd);

  assert.ok(launchStart >= 0 && launchEnd > launchStart);
  assert.match(launchSource, /new AbortController\(\)/);
  assert.match(launchSource, /homeCharacterLaunchOwnerSeqRef\.current/);
  assert.match(launchSource, /signal:\s*launchAbortController\.signal/);
  assert.match(launchSource, /isWebsochatAbortError\(error\)/);
  assert.ok(draftStart >= 0 && draftEnd > draftStart);
  assert.match(draftSource, /homeCharacterLaunchAbortControllerRef\.current\?\.abort\(\)/);
  assert.match(draftSource, /homeCharacterLaunchOwnerSeqRef\.current \+= 1/);
  assert.match(draftSource, /homeCharacterLaunchInFlightRef\.current = false/);
  assert.match(draftSource, /setIsCreatingHomeCharacterSession\(false\)/);
  assert.match(draftSource, /pendingDirectLaunchAbortControllerRef\.current\?\.abort\(\)/);
  assert.match(draftSource, /pendingDirectLaunchOwnerSeqRef\.current \+= 1/);
  assert.match(draftSource, /setPendingLaunchPayload\(null\)/);
});

test("pending direct RP launch만 optional signal과 owner guard로 late session 반영을 막는다", () => {
  const ensureStart = source.indexOf("const ensureActiveSessionForComposerMode");
  const ensureEnd = source.indexOf("const syncSessionModeGuide", ensureStart);
  const ensureSource = source.slice(ensureStart, ensureEnd);
  const activateStart = source.indexOf("const activateRpCharacterSelectionMode");
  const activateEnd = source.indexOf("const clearRpCharacterSelectionMode", activateStart);
  const activateSource = source.slice(activateStart, activateEnd);
  const pendingStart = source.indexOf("useEffect(() => {\n    if (!pendingLaunchPayload)");
  const pendingEnd = source.indexOf("const handleClickWebsochatCtaCard", pendingStart);
  const pendingSource = source.slice(pendingStart, pendingEnd);

  assert.ok(ensureStart >= 0 && ensureEnd > ensureStart);
  assert.match(ensureSource, /guard\?:\s*PendingDirectLaunchGuard/);
  assert.match(ensureSource, /signal:\s*guard\?\.signal/);
  assert.match(
    ensureSource,
    /if \(!isCurrentPendingDirectLaunchOwner\(\)\) return null;\s+const sessionId = created\.data\.sessionId/
  );
  assert.ok(activateStart >= 0 && activateEnd > activateStart);
  assert.match(activateSource, /guard\?:\s*PendingDirectLaunchGuard/);
  assert.match(
    activateSource,
    /ensureActiveSessionForComposerMode\(guard\)/
  );
  assert.ok(pendingStart >= 0 && pendingEnd > pendingStart);
  assert.match(pendingSource, /const pendingDirectLaunchAbortController = new AbortController\(\)/);
  assert.match(
    pendingSource,
    /activateRpCharacterSelectionMode\(\{\s*signal:\s*pendingDirectLaunchAbortController\.signal,\s*isCurrentOwner:\s*isCurrentPendingDirectLaunchOwner/
  );
});

test("viewer auto-send는 chooser의 composer clear가 assistant owner와 요청을 무효화해 late create를 막는다", () => {
  const clearStart = source.indexOf("const clearSessionScopedComposerState");
  const clearEnd = source.indexOf("useBrowserLayoutEffect", clearStart);
  const clearSource = source.slice(clearStart, clearEnd);
  const sendStart = source.indexOf("const handleSend");
  const sendEnd = source.indexOf(
    "const applyCitationReadScopeToSessionCaches",
    sendStart
  );
  const sendSource = source.slice(sendStart, sendEnd);

  assert.ok(clearStart >= 0 && clearEnd > clearStart);
  assert.match(clearSource, /assistantTurnOwnerSeqRef\.current \+= 1/);
  assert.match(clearSource, /activeAssistantAbortControllerRef\.current\?\.abort\(\)/);
  assert.ok(sendStart >= 0 && sendEnd > sendStart);
  assert.match(
    sendSource,
    /const created = await createSession\(\{[\s\S]+if \(!isCurrentAssistantTurnOwner\(\)\) return null;\s+sessionId = created\.data\.sessionId/
  );
});

test("세션 생성 mutation은 AbortSignal을 요청 body가 아닌 axios config로 전달한다", () => {
  const start = websochatQuerySource.indexOf("export const useCreateWebsochatSession");
  const end = websochatQuerySource.indexOf(
    "export const usePostWebsochatMessage",
    start
  );
  const mutationSource = websochatQuerySource.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(mutationSource, /signal\?:\s*AbortSignal/);
  assert.match(mutationSource, /mutationFn:\s*async \(\{\s*signal,\s*\.\.\.body\s*\}\)/);
  assert.match(
    mutationSource,
    /instance\.post\([^;]+body,\s*\{\s*signal\s*\}\s*\)/s
  );
});

test("일반 응답 액션에서도 구형 인물 대화를 필터링한다", () => {
  const start = source.indexOf("const renderWebsochatActionCards");
  const end = source.indexOf("const renderWebsochatCtaCards", start);
  const rendererSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(rendererSource, /isVisibleWebsochatPublicShortcutAction\(action\)/);
});

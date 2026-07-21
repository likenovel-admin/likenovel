import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildCharacterChatChoiceMessage,
  buildHomeCharacterChatSessionRequest,
  buildHomeCharacterWarmupMessages,
  consumePendingHomeCharacterChatLaunch,
  createSingleFlightRunner,
  findRecoverableHomeCharacterChatSession,
  queueHomeCharacterChatLaunch,
  resolveCharacterChatComposerPlaceholder,
} from "./characterChatLaunch.ts";
import {
  resolveWebsochatActiveSession,
  resolveWebsochatActorKey,
  resolveWebsochatSessionListTitle,
  shouldShowWebsochatStickyGuide,
} from "./websochatLaunch.ts";

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

const buildPendingLaunch = () => ({
  request: buildHomeCharacterChatSessionRequest({
    productId: 2005,
    characterScopeKey: "character:루벤세이린",
    characterName: "루벤 세이린",
    adultYn: "N" as const,
    accountReadEpisodeTo: 14,
  }),
  characterName: "루벤 세이린",
  characterImagePath: "/characters/ruben.webp",
  productTitle: "용기사 가문의 막내아들",
  authorNickname: "테스트 작가",
});

test("홈 캐릭터 카드 요청은 선택 인물과 캐릭터챗 계약을 고정한다", () => {
  assert.deepEqual(
    buildHomeCharacterChatSessionRequest({
      productId: 2005,
      characterScopeKey: "character:루벤세이린",
      characterName: "루벤 세이린",
      adultYn: "N",
      guestKey: "guest-1",
      accountReadEpisodeTo: 14,
    }),
    {
      product_id: 2005,
      guest_key: "guest-1",
      title: "루벤 세이린과의 대화",
      session_kind: "character_chat",
      entry_source: "home_character_slot",
      locked_character_scope_key: "character:루벤세이린",
      rp_mode: "free",
      adult_yn: "N",
      account_read_episode_to: 14,
    }
  );
});

test("웹소챗 주인공 선택기는 진입 출처만 바꾸고 캐릭터챗 계약을 유지한다", () => {
  assert.deepEqual(
    buildHomeCharacterChatSessionRequest({
      productId: 1103,
      characterScopeKey: "character:레이븐",
      characterName: "레이븐",
      adultYn: "N",
      entrySource: "websochat_rp_mode",
    }),
    {
      product_id: 1103,
      title: "레이븐과의 대화",
      session_kind: "character_chat",
      entry_source: "websochat_rp_mode",
      locked_character_scope_key: "character:레이븐",
      rp_mode: "free",
      adult_yn: "N",
    }
  );
});

test("읽은 범위가 없으면 임의 회차를 요청하지 않는다", () => {
  const request = buildHomeCharacterChatSessionRequest({
    productId: 1,
    characterScopeKey: "character:주인공",
    characterName: "주인공",
    adultYn: "Y",
  });
  assert.equal("account_read_episode_to" in request, false);
  assert.equal("guest_key" in request, false);
});

test("캐릭터챗 웜업은 작품 읽은 범위와 준비 단계를 순서대로 안내한다", () => {
  assert.deepEqual(
    buildHomeCharacterWarmupMessages({
      productTitle: "멸망한 도련님",
      readEpisodeNo: 14,
    }),
    [
      "〈멸망한 도련님〉을 14화까지 읽은 기록을 반영하고 있어요.",
      "캐릭터를 소환하고 있어요.",
      "캐릭터가 무대에 오를 준비를 하고 있어요.",
      "캐릭터가 지금까지의 스토리 맥락을 읽고 있어요.",
    ]
  );
  assert.equal(
    buildHomeCharacterWarmupMessages({
      productTitle: "멸망한 도련님",
      readEpisodeNo: null,
    })[0],
    "〈멸망한 도련님〉의 읽은 범위를 확인하고 있어요."
  );
});

test("홈 카드 진입은 생성 요청을 먼저 저장한 뒤 기존 세션을 비우고 채팅으로 이동한다", () => {
  const storage = createMemoryStorage();
  const events: string[] = [];
  queueHomeCharacterChatLaunch({
    payload: buildPendingLaunch(),
    storage,
    now: 1000,
    clearActiveSession: () => events.push("clear-active"),
    clearSessionListCache: () => events.push("clear-cache"),
    navigate: () => events.push("navigate"),
  });

  assert.deepEqual(events, ["clear-active", "clear-cache", "navigate"]);
  assert.deepEqual(
    consumePendingHomeCharacterChatLaunch({ storage, now: 1500 }),
    { ...buildPendingLaunch(), createdAt: 1000 }
  );
});

test("오래된 홈 캐릭터 진입 요청은 소비하지 않는다", () => {
  const storage = createMemoryStorage();
  queueHomeCharacterChatLaunch({
    payload: buildPendingLaunch(),
    storage,
    now: 1000,
    clearActiveSession: () => undefined,
    clearSessionListCache: () => undefined,
    navigate: () => undefined,
  });

  assert.equal(
    consumePendingHomeCharacterChatLaunch({ storage, now: 62_001 }),
    null
  );
});

test("single-flight는 진행 중인 중복 실행을 버리고 완료 후 다시 연다", async () => {
  const run = createSingleFlightRunner();
  let release: (() => void) | undefined;
  let calls = 0;
  const first = run(
    () =>
      new Promise<number>((resolve) => {
        calls += 1;
        release = () => resolve(1);
      })
  );
  const duplicate = await run(async () => {
    calls += 1;
    return 2;
  });
  assert.equal(duplicate, null);
  assert.equal(calls, 1);
  release?.();
  assert.equal(await first, 1);
  assert.equal(await run(async () => 3), 3);
});

test("캐릭터챗 선택지는 사용자 대사와 지문을 한 메시지로 조립한다", () => {
  assert.equal(
    buildCharacterChatChoiceMessage({
      label: "문틈 확인",
      dialogue: "제가 문틈 아래를 먼저 확인할게요.",
      narration: "등불을 낮춰 바닥을 비춘다.",
    }),
    "제가 문틈 아래를 먼저 확인할게요.\n* 등불을 낮춰 바닥을 비춘다."
  );
  assert.equal(
    buildCharacterChatChoiceMessage({
      label: "잠시 기다리기",
      dialogue: "잠깐 기다려 봐요.",
      narration: "* 숨을 죽이고 인기척을 살핀다.",
    }),
    "잠깐 기다려 봐요.\n* 숨을 죽이고 인기척을 살핀다."
  );
});

test("선택지 대사나 지문이 비면 남은 내용만 사용하고 label은 전송하지 않는다", () => {
  assert.equal(
    buildCharacterChatChoiceMessage({
      label: "질문하기",
      dialogue: "이 흔적을 알고 있어요?",
      narration: "",
    }),
    "이 흔적을 알고 있어요?"
  );
  assert.equal(
    buildCharacterChatChoiceMessage({
      label: "주변 살피기",
      dialogue: "",
      narration: "주변의 발자국을 살핀다.",
    }),
    "* 주변의 발자국을 살핀다."
  );
  assert.equal(
    buildCharacterChatChoiceMessage({
      label: "라벨만 있음",
      dialogue: "",
      narration: "",
    }),
    ""
  );
});

test("캐릭터챗 입력 힌트는 무료 횟수 뒤에 첫 선택지 대사를 사용한다", () => {
  assert.equal(
    resolveCharacterChatComposerPlaceholder({
      freeRemainingMessages: 10,
      firstChoiceDialogue: "제가 먼저 문을 열어볼게요.",
    }),
    "무료 10회 채팅 가능"
  );
  assert.equal(
    resolveCharacterChatComposerPlaceholder({
      freeRemainingMessages: 0,
      firstChoiceDialogue: "제가 먼저 문을 열어볼게요.",
    }),
    "제가 먼저 문을 열어볼게요."
  );
  assert.equal(
    resolveCharacterChatComposerPlaceholder({
      freeRemainingMessages: 0,
      firstChoiceDialogue: "",
    }),
    "하고 싶은 말을 입력해 주세요"
  );
});

test("응답이 유실된 직후 생성된 동일 캐릭터 세션만 복구한다", () => {
  const now = Date.parse("2026-07-11T05:30:00.000Z");
  const launch = {
    ...buildPendingLaunch(),
    createdAt: now - 20_000,
  };
  const matchingSession = {
    sessionId: 2177,
    productId: 2005,
    sessionKind: "character_chat",
    entrySource: "home_character_slot",
    lockedCharacterScopeKey: "character:루벤세이린",
    createdDate: "2026-07-11 14:29:58",
  };

  assert.equal(
    findRecoverableHomeCharacterChatSession({
      sessions: [matchingSession],
      launch,
      now,
    })?.sessionId,
    2177
  );
  assert.equal(
    findRecoverableHomeCharacterChatSession({
      sessions: [
        { ...matchingSession, lockedCharacterScopeKey: "character:다른인물" },
        { ...matchingSession, createdDate: new Date(now - 120_000).toISOString() },
      ],
      launch,
      now,
    }),
    null
  );
});

test("웹소챗 주인공 선택기에서 만든 동일 캐릭터 세션도 응답 유실 후 복구한다", () => {
  const now = Date.parse("2026-07-21T07:30:00.000Z");
  const launch = {
    request: buildHomeCharacterChatSessionRequest({
      productId: 1103,
      characterScopeKey: "character:레이븐",
      characterName: "레이븐",
      adultYn: "N",
      entrySource: "websochat_rp_mode",
    }),
    characterName: "레이븐",
    characterImagePath: "/characters/raven.webp",
    productTitle: "오염세계의 까마귀",
    authorNickname: "작가",
    createdAt: now - 10_000,
  };

  assert.equal(
    findRecoverableHomeCharacterChatSession({
      sessions: [
        {
          sessionId: 3103,
          productId: 1103,
          sessionKind: "character_chat",
          entrySource: "websochat_rp_mode",
          lockedCharacterScopeKey: "character:레이븐",
          createdDate: new Date(now - 9_000).toISOString(),
        },
      ],
      launch,
      now,
    })?.sessionId,
    3103
  );
});

test("인증 identity가 확정되기 전에는 sessions query actor를 만들지 않는다", () => {
  assert.equal(
    resolveWebsochatActorKey({
      isAuthInitialized: false,
      canUseAccountScope: true,
      userId: null,
      guestKey: "guest-key",
    }),
    ""
  );
  assert.equal(
    resolveWebsochatActorKey({
      isAuthInitialized: true,
      canUseAccountScope: true,
      userId: null,
      guestKey: "guest-key",
    }),
    ""
  );
  assert.equal(
    resolveWebsochatActorKey({
      isAuthInitialized: true,
      canUseAccountScope: true,
      userId: 77,
      guestKey: "guest-key",
    }),
    "user:77"
  );
  assert.equal(
    resolveWebsochatActorKey({
      isAuthInitialized: true,
      canUseAccountScope: false,
      userId: null,
      guestKey: "guest-key",
    }),
    "guest-key"
  );
});

test("actor와 현재 sessions 목록이 확정되기 전에는 저장된 세션을 유지한다", () => {
  const base = {
    actorReady: true,
    sessionsReady: true,
    activeSessionId: 2184,
    storedSessionId: 2184,
    sessionIds: [2170, 2184],
    hasDraftComposerContext: false,
    pendingSessionId: null,
  };

  assert.deepEqual(
    resolveWebsochatActiveSession({ ...base, actorReady: false, sessionIds: [] }),
    { action: "wait" }
  );
  assert.deepEqual(
    resolveWebsochatActiveSession({ ...base, sessionsReady: false, sessionIds: [] }),
    { action: "wait" }
  );
  assert.deepEqual(resolveWebsochatActiveSession(base), { action: "keep" });
  assert.deepEqual(
    resolveWebsochatActiveSession({ ...base, activeSessionId: null }),
    { action: "select", sessionId: 2184 }
  );
});

test("확정된 sessions 목록에서만 active session을 clear 또는 fallback한다", () => {
  const base = {
    actorReady: true,
    sessionsReady: true,
    activeSessionId: 2184,
    storedSessionId: 2184,
    sessionIds: [2170, 2184],
    hasDraftComposerContext: false,
    pendingSessionId: null,
  };

  assert.deepEqual(
    resolveWebsochatActiveSession({ ...base, sessionIds: [] }),
    { action: "clear" }
  );
  assert.deepEqual(
    resolveWebsochatActiveSession({
      ...base,
      activeSessionId: 9999,
      storedSessionId: 9999,
    }),
    { action: "select", sessionId: 2170 }
  );
  assert.deepEqual(
    resolveWebsochatActiveSession({
      ...base,
      activeSessionId: null,
      storedSessionId: null,
      hasDraftComposerContext: true,
    }),
    { action: "keep" }
  );
  assert.deepEqual(
    resolveWebsochatActiveSession({
      ...base,
      sessionIds: [],
      pendingSessionId: 2184,
    }),
    { action: "keep" }
  );
});

test("세션 목록은 캐릭터챗만 캐릭터 이름으로 표시한다", () => {
  assert.equal(
    resolveWebsochatSessionListTitle({
      sessionKind: "character_chat",
      title: "루벤과의 대화",
      characterDisplayName: "루벤",
    }),
    "루벤"
  );
  assert.equal(
    resolveWebsochatSessionListTitle({
      sessionKind: "character_chat",
      title: "라파엘과의 대화",
      characterDisplayName: null,
    }),
    "라파엘"
  );
  assert.equal(
    resolveWebsochatSessionListTitle({
      sessionKind: "websochat",
      title: "25화 이후 전개 질문",
      characterDisplayName: "루벤",
    }),
    "25화 이후 전개 질문"
  );
});

test("캐릭터챗 세션 행은 유형 배지와 아이콘 삭제 버튼을 사용한다", () => {
  const pageSource = readFileSync(
    new URL("../app/websochat/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, />\s*주인공챗\s*<\/span>/);
  assert.match(
    pageSource,
    /aria-label=\{`\$\{sessionListTitle\} 세션 삭제`\}[\s\S]*?title="삭제"[\s\S]*?<Trash/
  );
});

test("홈 캐릭터챗 생성 중에는 일반 웹소챗 초안 안내를 숨긴다", () => {
  const draftGuide = {
    activeSessionId: null,
    effectiveProductId: 2005,
    guideSessionId: null,
    guideProductId: null,
  };

  assert.equal(
    shouldShowWebsochatStickyGuide({
      ...draftGuide,
      isHomeCharacterLaunchPending: true,
    }),
    false
  );
  assert.equal(
    shouldShowWebsochatStickyGuide({
      ...draftGuide,
      isHomeCharacterLaunchPending: false,
    }),
    true
  );
  assert.equal(
    shouldShowWebsochatStickyGuide({
      ...draftGuide,
      activeSessionId: 2184,
      guideSessionId: 2184,
      isHomeCharacterLaunchPending: false,
    }),
    true
  );
});

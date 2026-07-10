import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHomeCharacterChatSessionRequest,
  createSingleFlightRunner,
  launchHomeCharacterChat,
} from "./characterChatLaunch.ts";

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

test("세션 생성 성공 후에만 저장하고 이동한다", async () => {
  const events: string[] = [];
  const sessionId = await launchHomeCharacterChat({
    request: buildHomeCharacterChatSessionRequest({
      productId: 1,
      characterScopeKey: "character:주인공",
      characterName: "주인공",
      adultYn: "N",
    }),
    createSession: async () => ({ data: { sessionId: 77 } }),
    saveSessionId: (id) => events.push(`save:${id}`),
    clearSessionListCache: () => events.push("clear-cache"),
    navigate: () => events.push("navigate"),
  });
  assert.equal(sessionId, 77);
  assert.deepEqual(events, ["save:77", "clear-cache", "navigate"]);
});

test("세션 생성 실패 시 저장하거나 이동하지 않는다", async () => {
  const events: string[] = [];
  await assert.rejects(
    launchHomeCharacterChat({
      request: buildHomeCharacterChatSessionRequest({
        productId: 1,
        characterScopeKey: "character:주인공",
        characterName: "주인공",
        adultYn: "N",
      }),
      createSession: async () => {
        throw new Error("network");
      },
      saveSessionId: () => events.push("save"),
      clearSessionListCache: () => events.push("clear-cache"),
      navigate: () => events.push("navigate"),
    }),
    /network/
  );
  assert.deepEqual(events, []);
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

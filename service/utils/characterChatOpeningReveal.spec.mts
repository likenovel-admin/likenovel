import assert from "node:assert/strict";
import test from "node:test";
import {
  CHARACTER_CHAT_OPENING_LEAD_IN_MS,
  resolveCharacterChatOpeningRevealFrame,
  shouldReleaseCharacterChatOpeningLoad,
  shouldShowCharacterChatOpeningPlaceholder,
} from "./characterChatOpeningReveal.ts";
import {
  createCharacterChatStreamReveal,
  resolveCharacterChatStreamRevealChunkSize,
  resolveCharacterChatStreamingKind,
} from "./characterChatStreamReveal.ts";

const opening = "*문이 열렸다.*\n\"기다리고 있었어. 들어와.\"";

test("첫 인사는 짧은 3점 대기 뒤 같은 말풍선에서 점진적으로 보인다", () => {
  const waiting = resolveCharacterChatOpeningRevealFrame({
    content: opening,
    elapsedMs: CHARACTER_CHAT_OPENING_LEAD_IN_MS - 1,
  });
  const progressing = resolveCharacterChatOpeningRevealFrame({
    content: opening,
    elapsedMs: CHARACTER_CHAT_OPENING_LEAD_IN_MS + 500,
  });

  assert.equal(waiting.visibleText, "");
  assert.equal(waiting.isWaiting, true);
  assert.equal(waiting.isComplete, false);
  assert.ok(progressing.visibleText.length > 0);
  assert.ok(progressing.visibleText.length < opening.length);
  assert.equal(progressing.isWaiting, false);
  assert.equal(progressing.isComplete, false);
});

test("표시 시간이 끝나면 원문을 손실 없이 전부 보여준다", () => {
  const frame = resolveCharacterChatOpeningRevealFrame({
    content: opening,
    elapsedMs: 10_000,
  });

  assert.equal(frame.visibleText, opening);
  assert.equal(frame.isComplete, true);
});

test("모션 감소 환경에서는 인사를 즉시 전부 보여준다", () => {
  const frame = resolveCharacterChatOpeningRevealFrame({
    content: opening,
    elapsedMs: 0,
    prefersReducedMotion: true,
  });

  assert.equal(frame.visibleText, opening);
  assert.equal(frame.isWaiting, false);
  assert.equal(frame.isComplete, true);
});

test("첫 문장이 도착하면 별도 대기 말풍선을 제거한다", () => {
  assert.equal(
    shouldShowCharacterChatOpeningPlaceholder({
      isOpeningBusy: true,
      hasOpeningMessage: false,
      hasError: false,
    }),
    true
  );
  assert.equal(
    shouldShowCharacterChatOpeningPlaceholder({
      isOpeningBusy: true,
      hasOpeningMessage: true,
      hasError: false,
    }),
    false
  );
  assert.equal(
    shouldShowCharacterChatOpeningPlaceholder({
      isOpeningBusy: true,
      hasOpeningMessage: false,
      hasError: true,
    }),
    false
  );
});

test("첫인사 조회가 실패하거나 빈 응답이면 준비 상태를 해제한다", () => {
  assert.equal(
    shouldReleaseCharacterChatOpeningLoad({
      hasOpeningSession: true,
      isFetching: false,
      isError: true,
      hasLoadedResponse: false,
      hasOpeningMessage: false,
    }),
    true
  );
  assert.equal(
    shouldReleaseCharacterChatOpeningLoad({
      hasOpeningSession: true,
      isFetching: false,
      isError: false,
      hasLoadedResponse: true,
      hasOpeningMessage: false,
    }),
    true
  );
  assert.equal(
    shouldReleaseCharacterChatOpeningLoad({
      hasOpeningSession: true,
      isFetching: true,
      isError: false,
      hasLoadedResponse: false,
      hasOpeningMessage: false,
    }),
    false
  );
});

test("큰 단일 SSE 델타도 여러 프레임으로 나눠 원문 그대로 표시한다", async () => {
  const updates: string[] = [];
  const reveal = createCharacterChatStreamReveal({
    onUpdate: (text) => updates.push(text),
    intervalMs: 1,
    resolveChunkSize: () => 2,
  });

  reveal.append("루벤은 🗡️ 검을 들었다.");
  await reveal.drain();

  assert.ok(updates.length > 1);
  assert.equal(updates.at(-1), "루벤은 🗡️ 검을 들었다.");
  assert.ok(
    updates.every(
      (text, index) => index === 0 || text.length >= updates[index - 1].length
    )
  );
});

test("서로 다른 SSE 델타를 순서대로 이어 붙인다", async () => {
  const updates: string[] = [];
  const reveal = createCharacterChatStreamReveal({
    onUpdate: (text) => updates.push(text),
    intervalMs: 1,
    resolveChunkSize: () => 1,
  });

  reveal.append("첫 문장. ");
  reveal.append("다음 문장.");
  await reveal.drain();

  assert.equal(updates.at(-1), "첫 문장. 다음 문장.");
});

test("SSE 표시를 취소하면 이후 텍스트를 표시하지 않는다", async () => {
  const updates: string[] = [];
  const reveal = createCharacterChatStreamReveal({
    onUpdate: (text) => updates.push(text),
    intervalMs: 50,
    resolveChunkSize: () => 1,
  });

  reveal.append("표시되면 안 된다");
  const drained = reveal.drain();
  reveal.cancel();
  await drained;

  assert.deepEqual(updates, []);
});

test("SSE 표시 청크 크기는 입력 길이에 맞춰 양수로 계산한다", () => {
  assert.equal(resolveCharacterChatStreamRevealChunkSize(0), 0);
  assert.ok(resolveCharacterChatStreamRevealChunkSize(20) >= 1);
  assert.ok(resolveCharacterChatStreamRevealChunkSize(600) > 1);
});

test("캐릭터챗 수동 입력은 RP 스트림으로 분류한다", () => {
  assert.equal(
    resolveCharacterChatStreamingKind({
      inferredKind: "qa",
      activeSessionKind: "character_chat",
    }),
    "rp"
  );
  assert.equal(
    resolveCharacterChatStreamingKind({
      inferredKind: "qa",
      activeSessionKind: "standard",
    }),
    "qa"
  );
});

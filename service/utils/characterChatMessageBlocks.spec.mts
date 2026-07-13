import assert from "node:assert/strict";
import test from "node:test";
import { parseCharacterChatMessageBlocks } from "./characterChatMessageBlocks.ts";

test("지문과 선택 캐릭터 대사를 빈 문단 기준으로 분리한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "루벤은 검 끝을 천천히 내렸다.\n\n\"여기서 기다려. 내가 먼저 확인하지.\"",
    primarySpeakerName: "루벤",
  });

  assert.equal(parsed.hasDialogue, true);
  assert.deepEqual(parsed.blocks, [
    { kind: "narration", text: "루벤은 검 끝을 천천히 내렸다." },
    {
      kind: "dialogue",
      text: "여기서 기다려. 내가 먼저 확인하지.",
      speakerName: "루벤",
      isPrimarySpeaker: true,
    },
  ]);
});

test("단일 줄바꿈으로 이어진 지문과 대사도 분리한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "루벤은 고개를 들었다.\n\"지금 움직여.\"",
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(parsed.blocks, [
    { kind: "narration", text: "루벤은 고개를 들었다." },
    {
      kind: "dialogue",
      text: "지금 움직여.",
      speakerName: "루벤",
      isPrimarySpeaker: true,
    },
  ]);
});

test("지문과 대사가 단일 줄바꿈으로 반복되어도 순서를 유지한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "첫 지문\n\"첫 대사\"\n둘째 지문\n로크: \"둘째 대사\"",
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(
    parsed.blocks.map((block) => [
      block.kind,
      block.text,
      block.kind === "dialogue" ? block.speakerName : null,
    ]),
    [
      ["narration", "첫 지문", null],
      ["dialogue", "첫 대사", "루벤"],
      ["narration", "둘째 지문", null],
      ["dialogue", "둘째 대사", "로크"],
    ]
  );
});

test("명시된 다른 인물 대사는 실제 화자명과 보조 캐릭터로 분류한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "문밖에서 급한 발소리가 멎었다.\n\n로크: \"대장, 북문이 열렸습니다.\"",
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(parsed.blocks[1], {
    kind: "dialogue",
    text: "대장, 북문이 열렸습니다.",
    speakerName: "로크",
    isPrimarySpeaker: false,
  });
});

test("같은 문단의 지문과 명시 화자 대사를 순서대로 분리한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content:
      '루벤 세이린은 황제를 노려봤다. 루벤 세이린: "수수께끼는 충분합니다." 황제는 고개를 돌렸다.\n\n황제: "관찰한 것이다."',
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(parsed.blocks, [
    { kind: "narration", text: "루벤 세이린은 황제를 노려봤다." },
    {
      kind: "dialogue",
      text: "수수께끼는 충분합니다.",
      speakerName: "루벤",
      isPrimarySpeaker: true,
    },
    { kind: "narration", text: "황제는 고개를 돌렸다." },
    {
      kind: "dialogue",
      text: "관찰한 것이다.",
      speakerName: "황제",
      isPrimarySpeaker: false,
    },
  ]);
});

test("명시 화자가 선택 캐릭터와 같으면 CMS 프로필 대상이다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "루벤: “내가 앞장서지.”",
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(parsed.blocks[0], {
    kind: "dialogue",
    text: "내가 앞장서지.",
    speakerName: "루벤",
    isPrimarySpeaker: true,
  });
});

test("지문 안의 인용문과 콜론은 화자 대사로 추측하지 않는다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "루벤은 문에 적힌 문구: \"출입 금지\"를 손끝으로 훑었다.",
    primarySpeakerName: "루벤",
  });

  assert.equal(parsed.hasDialogue, false);
  assert.deepEqual(parsed.blocks, [
    {
      kind: "narration",
      text: "루벤은 문에 적힌 문구: \"출입 금지\"를 손끝으로 훑었다.",
    },
  ]);
});

test("스트리밍 중 마지막 대사의 닫는 따옴표가 없어도 대사로 유지한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "루벤은 고개를 들었다.\n\n\"지금부터 내가",
    primarySpeakerName: "루벤",
    allowIncompleteFinalDialogue: true,
  });

  assert.deepEqual(parsed.blocks[1], {
    kind: "dialogue",
    text: "지금부터 내가",
    speakerName: "루벤",
    isPrimarySpeaker: true,
  });
});

test("완료 메시지의 닫히지 않은 따옴표는 지문으로 남긴다", () => {
  const content = "\"아직 끝나지 않은 문장";
  const parsed = parseCharacterChatMessageBlocks({
    content,
    primarySpeakerName: "루벤",
  });

  assert.equal(parsed.hasDialogue, false);
  assert.deepEqual(parsed.blocks, [{ kind: "narration", text: content }]);
});

test("CRLF와 여러 빈 줄을 처리하고 텍스트 순서를 보존한다", () => {
  const parsed = parseCharacterChatMessageBlocks({
    content: "첫 지문\r\n\r\n\r\n\"첫 대사\"\r\n\r\n둘째 지문",
    primarySpeakerName: "루벤",
  });

  assert.deepEqual(
    parsed.blocks.map((block) => block.text),
    ["첫 지문", "첫 대사", "둘째 지문"]
  );
});

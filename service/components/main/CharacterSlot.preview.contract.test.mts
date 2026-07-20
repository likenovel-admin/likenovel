import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const slotSource = fs.readFileSync(
  new URL("./CharacterSlot.tsx", import.meta.url),
  "utf8"
);
const modalSource = fs.readFileSync(
  new URL("./CharacterChatPreviewModal.tsx", import.meta.url),
  "utf8"
);

test("캐릭터 카드는 세션을 만들지 않고 미리보기 모달을 연다", () => {
  assert.match(slotSource, /onClick=\{\(\) => setSelectedItem\(item\)\}/);
  assert.match(slotSource, /aria-haspopup="dialog"/);
  assert.match(
    slotSource,
    /onLaunch=\{\(item\) => void handleCharacterClick\(item\)\}/
  );
});

test("모달은 구좌와 동일한 이미지와 비율을 사용한다", () => {
  assert.match(
    modalSource,
    /resolveProductCoverImage\(item\.characterImagePath\)/
  );
  assert.match(modalSource, /aspect-\[364\/414\]/);
  assert.match(modalSource, /~\{item\.syncedLatestEpisodeNo\}화까지/);
});

test("모바일과 데스크톱 모달에서 기존 시작 동작과 작품 이동을 제공한다", () => {
  assert.match(modalSource, /device === "mobile"/);
  assert.match(modalSource, /<BottomSheetContainer/);
  assert.match(modalSource, /<ModalContainer/);
  assert.match(modalSource, /onClick=\{\(\) => onLaunch\(item\)\}/);
  assert.match(modalSource, /onClick=\{\(\) => onGoToProduct\(item\)\}/);
  assert.match(slotSource, /getEpisodeListQueryOptions/);
  assert.match(slotSource, /queueHomeCharacterChatLaunch/);
});

test("존재하지 않는 preview API를 호출하지 않는다", () => {
  assert.doesNotMatch(slotSource, /getMainCharacterSlotPreview/);
  assert.doesNotMatch(modalSource, /getMainCharacterSlotPreview/);
});

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
const gridSource = fs.readFileSync(
  new URL("./CharacterChatCardGrid.tsx", import.meta.url),
  "utf8"
);

test("모달은 캐릭터 최초 등장 회차를 선택 하한과 기본 시점으로 사용한다", () => {
  assert.match(
    modalSource,
    /import \{ resolveCharacterChatEpisodeScope \} from "@\/utils\/characterChatEpisodeScope"/,
  );
  assert.match(
    modalSource,
    /resolveCharacterChatEpisodeScope\(\{[\s\S]*entryEpisodeNo: item\.entryEpisodeNo,[\s\S]*preparedEpisodeNo: item\.syncedLatestEpisodeNo,[\s\S]*accountReadEpisodeNo/,
  );
  assert.match(
    modalSource,
    /selectableEpisodeNos\.map\(\(episodeNo\) =>/,
  );
  assert.match(
    modalSource,
    /disabled=\{[\s\S]*isReadScopeLoading \|\|[\s\S]*maxSelectableEpisodeNo === entryEpisodeNo[\s\S]*\}/,
  );
  assert.match(
    modalSource,
    /읽은 기록을 불러오지 못해 \$\{entryEpisodeNo\}화 시점으로 설정했어요/,
  );
  assert.match(
    modalSource,
    /읽은 기록이 없어 \$\{entryEpisodeNo\}화 시점으로 시작해요/,
  );
});

test("캐릭터 카드는 세션을 만들지 않고 미리보기 모달을 연다", () => {
  assert.match(slotSource, /<CharacterChatCardGrid/);
  assert.match(gridSource, /onClick=\{\(\) => setSelectedItem\(item\)\}/);
  assert.match(gridSource, /aria-haspopup="dialog"/);
  assert.match(
    gridSource,
    /onLaunch=\{\(item, selectedEpisodeNo\) =>\s*void handleCharacterClick\(item, selectedEpisodeNo\)/
  );
});

test("모달은 구좌와 동일한 이미지와 비율을 사용한다", () => {
  assert.match(
    modalSource,
    /resolveProductCoverImage\(item\.characterImagePath\)/
  );
  assert.match(modalSource, /aspect-\[364\/414\]/);
  assert.match(modalSource, /\{item\.syncedLatestEpisodeNo\}화까지 준비/);
});

test("모바일과 데스크톱 모달에서 기존 시작 동작과 작품 이동을 제공한다", () => {
  assert.match(modalSource, /device === "mobile"/);
  assert.match(modalSource, /<BottomSheetContainer/);
  assert.match(modalSource, /<ModalContainer/);
  assert.match(
    modalSource,
    /onClick=\{\(\) => onLaunch\(item, selectedEpisodeNo\)\}/
  );
  assert.match(modalSource, /onClick=\{\(\) => onGoToProduct\(item\)\}/);
  assert.match(modalSource, /getEpisodeListQueryOptions/);
  assert.match(gridSource, /queueHomeCharacterChatLaunch/);
});

test("존재하지 않는 preview API를 호출하지 않는다", () => {
  assert.doesNotMatch(slotSource, /getMainCharacterSlotPreview/);
  assert.doesNotMatch(modalSource, /getMainCharacterSlotPreview/);
});

test("preview 404는 미리보기 준비 중으로 안내하되 대화 시작은 허용한다", () => {
  assert.match(modalSource, /error: previewError/);
  assert.match(modalSource, /getWebsochatErrorStatus\(previewError\)/);
  assert.match(modalSource, /previewErrorStatus === 404/);
  assert.match(
    modalSource,
    /장면 미리보기는 준비 중이지만 대화는 시작할 수 있어요\./,
  );
  assert.match(
    modalSource,
    /isPreviewUnavailable && !isPreviewNotFound && \(/,
  );
  assert.match(
    modalSource,
    /disabled=\{isLaunching \|\| isReadScopeLoading\}/,
  );
  assert.doesNotMatch(modalSource, /"주인공챗 준비 중"/);
  assert.match(
    modalSource,
    /`\$\{selectedEpisodeNo\}화의 \$\{item\.characterName\}에게 말 걸기`/,
  );
});

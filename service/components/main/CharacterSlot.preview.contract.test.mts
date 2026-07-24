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

test("모달은 원문 회차 요약을 렌더링하지 않는다", () => {
  assert.doesNotMatch(modalSource, /이 회차 이야기/);
  assert.doesNotMatch(modalSource, /\{episodeSummary\}/);
});

test("내부 주인공 role만 사용자용 문구로 정규화한다", () => {
  assert.match(modalSource, /const rawRoleLabel =/);
  assert.match(modalSource, /const normalizedRoleLabel =/);
  assert.match(modalSource, /normalizedRoleLabel === "main_protagonist"/);
  assert.match(modalSource, /normalizedRoleLabel === "main protagonist"/);
  assert.match(modalSource, /\? "메인 주인공"[\s\S]*: rawRoleLabel/);
});

test("대화 스타일은 공백을 정리하고 무의미한 보통 값만 숨긴다", () => {
  assert.match(modalSource, /\.map\(\(value\) => value\.trim\(\)\)/);
  assert.match(modalSource, /\.filter\(\(value\) => Boolean\(value\) && value !== "보통"\)/);
});

test("회차 선택지는 실제 제목을 우선하고 필요한 제목 페이지만 보강한다", () => {
  assert.match(modalSource, /limit: 100/);
  assert.match(modalSource, /order_dir: "asc"/);
  assert.match(modalSource, /episodeTitleByNo/);
  assert.match(
    modalSource,
    /const episodeLabel =\s*episodeTitleByNo\[episodeNo\]\?\.trim\(\) \|\| `\$\{episodeNo\}화`/,
  );
  assert.match(
    modalSource,
    /\{episodeLabel\}\{isRecentRead \? " · 최근 읽은 회차" : ""\}/,
  );
});

test("회차 제목 페이지는 row-offset 기준으로 2페이지부터 순차 보강한다", () => {
  assert.match(
    modalSource,
    /const totalEpisodePages = Math\.ceil\(\s*response\.data\.pagination\.totalCount \/ 100\s*\)/,
  );
  assert.match(
    modalSource,
    /for \(let page = 2; page <= totalEpisodePages; page \+= 1\)/,
  );
  assert.match(
    modalSource,
    /if \(cancelled\) return;[\s\S]*const pageResponse = await queryClient\.fetchQuery[\s\S]*if \(cancelled\) return;/,
  );
  assert.match(
    modalSource,
    /pageMaxEpisodeNo >= episodeScope\.maxSelectableEpisodeNo[\s\S]*break/,
  );
  assert.doesNotMatch(
    modalSource,
    /episodeScope\.(?:entryEpisodeNo|maxSelectableEpisodeNo)[\s\S]{0,80}\/ 100/,
  );
  assert.doesNotMatch(modalSource, /Promise\.allSettled/);
});

test("첫 회차 페이지로 즉시 ready가 된 뒤 제목을 stale-safe하게 보강한다", () => {
  const readyIndex = modalSource.indexOf(
    "applyReadScope(response.data.latestEpisodeNo);",
  );
  const additionalPageLoopIndex = modalSource.indexOf(
    "for (let page = 2; page <= totalEpisodePages; page += 1)",
  );

  assert.notEqual(readyIndex, -1);
  assert.notEqual(additionalPageLoopIndex, -1);
  assert.ok(readyIndex < additionalPageLoopIndex);
  assert.match(
    modalSource,
    /setReadScope\(\(currentReadScope\) =>[\s\S]*currentReadScope\.characterSlotId !== item\.characterSlotId[\s\S]*episodeTitleByNo: \{[\s\S]*currentReadScope\.episodeTitleByNo/,
  );
  assert.match(
    modalSource,
    /catch \{[\s\S]*continue;[\s\S]*\}/,
  );
});

test("실제 장면 로딩에만 spinner를 표시하고 status 문구를 유지한다", () => {
  assert.match(
    modalSource,
    /shouldShowInitialLoader[\s\S]*animate-spin[\s\S]*role="status"[\s\S]*장면을 불러오는 중이에요/,
  );
  assert.match(
    modalSource,
    /!isPreviewUnavailable && \([\s\S]*animate-spin[\s\S]*<p role="status">/,
  );
});

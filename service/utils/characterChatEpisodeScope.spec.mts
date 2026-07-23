import assert from "node:assert/strict";
import test from "node:test";
import { resolveCharacterChatEpisodeScope } from "./characterChatEpisodeScope.ts";

test("최초 등장 회차가 없으면 기존 홈 슬롯처럼 1화에서 시작한다", () => {
  assert.deepEqual(
    resolveCharacterChatEpisodeScope({
      preparedEpisodeNo: 10,
      accountReadEpisodeNo: null,
    }),
    {
      entryEpisodeNo: 1,
      initialReadEpisodeNo: 1,
      maxSelectableEpisodeNo: 1,
      selectableEpisodeNos: [1],
    }
  );
});

test("2화 진입 캐릭터는 읽은 기록이 없거나 1화여도 2화에서 시작한다", () => {
  const noReadScope = resolveCharacterChatEpisodeScope({
    entryEpisodeNo: 2,
    preparedEpisodeNo: 3,
    accountReadEpisodeNo: null,
  });
  const beforeEntryScope = resolveCharacterChatEpisodeScope({
    entryEpisodeNo: 2,
    preparedEpisodeNo: 3,
    accountReadEpisodeNo: 1,
  });

  assert.deepEqual(noReadScope, {
    entryEpisodeNo: 2,
    initialReadEpisodeNo: 2,
    maxSelectableEpisodeNo: 2,
    selectableEpisodeNos: [2],
  });
  assert.deepEqual(beforeEntryScope, noReadScope);
});

test("읽은 5화와 준비 3화 중 낮은 회차까지만 2화 진입 범위로 제공한다", () => {
  assert.deepEqual(
    resolveCharacterChatEpisodeScope({
      entryEpisodeNo: 2,
      preparedEpisodeNo: 3,
      accountReadEpisodeNo: 5,
    }),
    {
      entryEpisodeNo: 2,
      initialReadEpisodeNo: 3,
      maxSelectableEpisodeNo: 3,
      selectableEpisodeNos: [3, 2],
    }
  );
});

test("준비 10화 안에서 8화까지 읽었으면 8화를 기본으로 선택한다", () => {
  const scope = resolveCharacterChatEpisodeScope({
    entryEpisodeNo: 3,
    preparedEpisodeNo: 10,
    accountReadEpisodeNo: 8,
  });

  assert.equal(scope.initialReadEpisodeNo, 8);
  assert.equal(scope.maxSelectableEpisodeNo, 8);
  assert.deepEqual(scope.selectableEpisodeNos, [8, 7, 6, 5, 4, 3]);
});

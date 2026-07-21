import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./WebsochatStartChooser.tsx", import.meta.url),
  "utf8"
);

const staticClassTokens = new Set(
  [...source.matchAll(/className="([^"]+)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean)
  )
);

const jsxText = [...source.matchAll(/>([^<{]+)</g)]
  .map((match) => match[1].replace(/\s+/g, " ").trim())
  .filter(Boolean)
  .join("\n");

test("빈 진입 화면은 두 대화 방식을 명확히 안내한다", () => {
  for (const text of [
    "어떤 대화를 시작할까요?",
    "웹소챗",
    "작품에 대해 물어보기",
    "주인공챗",
    "주인공과 대화하기",
  ]) {
    assert.match(jsxText, new RegExp(text));
  }

  assert.ok(staticClassTokens.has("grid-cols-1"));
  assert.ok(staticClassTokens.has("md:grid-cols-2"));
  assert.match(source, /onClick=\{onChooseWebsochat\}/);
  assert.match(source, /onClick=\{onChooseCharacterChat\}/);
});

test("주인공 목록은 공개 카드 정보와 확정된 반응형 열만 사용한다", () => {
  for (const token of ["grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6"]) {
    assert.ok(staticClassTokens.has(token), `${token} 열 계약이 필요합니다.`);
  }

  assert.match(source, /resolveProductCoverImage\(\s*item\.characterImagePath/);
  assert.match(source, /\{item\.productTitle\}/);
  assert.match(source, /\{item\.characterName\}/);
  assert.match(source, /~\{item\.syncedLatestEpisodeNo\}화까지/);
  assert.match(source, /onClick=\{\(\) => setSelectedItem\(item\)\}/);
});

test("주인공 선택은 기존 미리보기 모달과 실행 콜백을 재사용한다", () => {
  assert.match(
    source,
    /import CharacterChatPreviewModal from "@\/components\/main\/CharacterChatPreviewModal";/
  );
  assert.match(source, /<CharacterChatPreviewModal/);
  assert.match(source, /item=\{selectedItem\}/);
  assert.match(source, /isLaunching=\{launching\}/);
  assert.match(source, /onLaunch=\{onLaunchCharacter\}/);
  assert.match(source, /onGoToProduct=\{onGoToProduct\}/);
  assert.match(source, /onClose=\{/);
});

test("로딩·빈 목록·오류 복구 계약과 48px 조작 영역을 제공한다", () => {
  assert.match(source, /<CharacterGridSkeleton \/>/);
  assert.match(jsxText, /지금 대화할 수 있는 주인공이 없어요\./);
  assert.match(jsxText, /웹소챗 시작하기/);
  assert.match(jsxText, /다시 시도/);
  assert.match(source, /onClick=\{onRetry\}/);
  assert.ok(staticClassTokens.has("min-h-48pxr"));
  assert.ok(staticClassTokens.has("focus-visible:ring-primary-100"));
});

test("사용자 화면에 CMS 품질 등급이나 내부 점수를 노출하지 않는다", () => {
  for (const forbidden of [
    "양호",
    "보통",
    "부족",
    "준비도",
    "readiness",
    "score",
    "percent",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden, "i"));
  }
});

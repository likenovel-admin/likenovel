import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sectionPath = new URL(
  "./ProductDetailCharacterChatSection.tsx",
  import.meta.url
);
const detailPath = new URL(
  "../../app/product/[id]/ProductDetailClient.tsx",
  import.meta.url
);

test("작품 상세 주인공챗 카드는 미리보기 모달을 열고 대화하기 버튼만 채팅으로 보낸다", () => {
  const sectionSource = readFileSync(sectionPath, "utf8");
  const detailSource = readFileSync(detailPath, "utf8");

  assert.match(sectionSource, /useGetCharacterChatCatalog/);
  assert.match(sectionSource, /item\.productId === productId/);
  assert.match(sectionSource, /if \(characterItems\.length === 0\) return null/);
  assert.match(sectionSource, /주인공챗/);
  assert.doesNotMatch(sectionSource, /등장인물 톡/);
  assert.match(sectionSource, /등장인물과 바로 대화해요/);
  assert.match(sectionSource, /읽은 회차까지만 기억해요/);
  assert.match(sectionSource, /item\.teaserLine/);
  assert.match(sectionSource, /resolveCharacterChatEpisodeScope/);
  assert.match(sectionSource, /와 바로 대화 시작/);
  assert.match(sectionSource, /미리보기와 회차 선택/);
  assert.doesNotMatch(
    sectionSource,
    /ExclamationMark/,
    "카드 전체가 모달 진입점이므로 별도 정보 아이콘을 두지 않는다"
  );
  assert.doesNotMatch(sectionSource, />\s*\?\s*<\/button>/);
  assert.match(
    sectionSource,
    /onClick=\{\(\) => handleDirectStart\(item\)\}/,
    "대화하기 버튼만 채팅 세션을 시작한다"
  );
  assert.match(
    sectionSource,
    /absolute inset-0/,
    "썸네일과 카드 본문 어디를 눌러도 미리보기 모달이 열려야 한다"
  );
  assert.doesNotMatch(
    sectionSource,
    /seed === undefined/,
    "카탈로그가 lastViewedEpisodeNo를 항상 내려주므로 폴백 분기를 두지 않는다"
  );
  assert.match(sectionSource, /onClick=\{\(\) => setSelectedItem\(item\)\}/);
  assert.match(sectionSource, /<CharacterChatPreviewModal/);
  assert.match(sectionSource, /entrySource: "character_catalog"/);
  assert.match(sectionSource, /overflow-x-auto/);
  assert.match(sectionSource, /snap-x/);
  assert.match(sectionSource, /md:grid-cols-2/);
  assert.match(sectionSource, /rounded-\[8px\]/);
  assert.match(
    sectionSource,
    /h-\[40px\] min-w-\[100px\][\s\S]*?text-14pxr/,
    "대화하기는 모바일과 데스크톱에서 일반 CTA 크기를 유지해야 한다"
  );
  assert.match(sectionSource, /line-clamp-2/);
  assert.doesNotMatch(sectionSource, /block truncate text-12pxr/);
  assert.match(sectionSource, /hasCharacterImage/);
  assert.match(sectionSource, /characterName\.trim\(\)\.charAt\(0\)/);
  assert.match(sectionSource, /aria-hidden/);
  assert.match(detailSource, /<ProductDetailCharacterChatSection/);
  assert.match(
    detailSource,
    /<ProductDetailCharacterChatSection[\s\S]*?enabled=\{isAuthIdentitySettled\}/
  );
  assert.doesNotMatch(
    detailSource,
    /<ProductDetailCharacterChatSection[\s\S]*?enabled=\{[\s\S]*?shouldLoadSecondaryProductDetailData[\s\S]*?\}/
  );
  assert.ok(
    detailSource.indexOf("<ProductDetailCharacterChatSection") <
      detailSource.indexOf("<AiLibrarianDetailCard"),
    "주인공챗은 AI 사서보다 먼저 보여야 한다"
  );
});

import assert from "node:assert/strict";
import {
  buildAiLibrarianCopy,
  type AiProductBrief,
  PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS,
  buildProductDetailAiLibrarianPath,
  shouldFocusAiLibrarian,
} from "./aiLibrarian.ts";

const fantasyProduct = {
  productId: 101,
  title: "검은 탑의 막내 사서",
  synopsis:
    "잊힌 마법 도서관에서 시작된 소년의 성장담. 오래된 계약과 사라진 왕국의 비밀을 따라간다.",
  genre: ["판타지", "성장"],
  keywords: ["마법", "세계관", "동료"],
  authorNickname: "테스터",
  priceType: "free",
  totalOpenEpisodeCount: 12,
  remainingNotificationCount: 0,
  interestStatus: "none",
  rank: {},
  image: {},
} as const;

const copy = buildAiLibrarianCopy(fantasyProduct);

assert.equal(copy.preview.includes("검은 탑의 막내 사서"), true);
assert.equal(copy.preview.includes("마법"), false);
assert.equal(copy.points.length, 3);
assert.deepEqual(copy.chips, []);

const roughSynopsisCopy = buildAiLibrarianCopy({
  ...fantasyProduct,
  title: "이종족 몬스터 크래프트",
  synopsis:
    "게이트 속 이종족 몬스터들을 일꾼으로 부리기로 했다. 나만의 크래프트와 군단을 만들어보니, 역시 존나 재밌다.",
  genre: ["판타지"],
  keywords: [],
});

assert.equal(roughSynopsisCopy.preview.includes("존나"), false);
assert.equal(roughSynopsisCopy.intro.includes("존나"), false);
assert.equal(roughSynopsisCopy.preview.includes("이종족 몬스터 크래프트"), true);

const aiBrief = {
  productId: 101,
  title: "검은 탑의 막내 사서",
  premise:
    "잊힌 마법 도서관에서 살아남은 소년이 오래된 계약과 사라진 왕국의 비밀을 따라 성장한다.",
  hook:
    "마법 도서관의 마지막 사서가 된 소년이 금서와 계약을 읽어내며 무너진 왕국의 진실에 접근한다.",
  mood: "신비롭고 긴장감 있는 분위기",
  pacing: "medium",
  protagonistType: "성장형 사서",
  protagonistGoal: "진실 추적",
  tasteTags: ["마법", "세계관", "성장"],
  worldviewTags: ["마법 도서관", "사라진 왕국"],
  protagonistTypeTags: ["성장형"],
  protagonistJobTags: ["사서"],
  protagonistMaterialTags: ["금서"],
  styleTags: ["미스터리", "모험"],
  romanceTags: [],
} satisfies AiProductBrief;

const aiCopy = buildAiLibrarianCopy(fantasyProduct, aiBrief);

assert.equal(aiCopy.preview.includes("마법 도서관"), true);
assert.equal(aiCopy.preview.includes("진실"), true);
assert.equal(aiCopy.previewLines.length, 2);
assert.equal(aiCopy.previewLines.some((line) => line.includes("…")), false);
assert.match(aiCopy.previewLines[1], /전개/);
assert.doesNotMatch(aiCopy.previewLines[1], /마법·세계관·성장/);
assert.doesNotMatch(aiCopy.previewLines[1], /강점/);
assert.equal(aiCopy.intro.includes("마지막 사서"), true);
assert.equal(aiCopy.points.some((point) => point.includes("진실 추적")), true);
assert.deepEqual(aiCopy.chips.slice(0, 4), ["마법", "세계관", "성장", "마법 도서관"]);
assert.equal(aiCopy.chips.includes("동료"), false);

const aiOnlyChipCopy = buildAiLibrarianCopy(
  {
    ...fantasyProduct,
    keywords: ["작가태그"],
    genre: ["작가장르"],
  },
  {
    ...aiBrief,
    tasteTags: ["AI취향"],
    worldviewTags: [],
    protagonistTypeTags: [],
    protagonistJobTags: [],
    protagonistMaterialTags: [],
    styleTags: [],
    romanceTags: [],
  }
);

assert.deepEqual(aiOnlyChipCopy.chips, ["AI취향"]);
assert.equal(aiOnlyChipCopy.previewLines.some((line) => line.includes("작가태그")), false);
assert.equal(aiOnlyChipCopy.points.some((point) => point.includes("작가태그")), false);

const fallbackCopy = buildAiLibrarianCopy({
  ...fantasyProduct,
  productId: 102,
  title: "제목만 있는 작품",
  synopsis: "",
  genre: [],
  keywords: [],
});

assert.equal(
  fallbackCopy.preview,
  "「제목만 있는 작품」은 아직 자세한 소개가 적지만, 초반 분위기와 인물의 목표를 따라가며 읽어볼 만해요.",
);
assert.equal(fallbackCopy.chips.length, 0);

assert.equal(
  buildProductDetailAiLibrarianPath(101),
  `/product/101?focus=${PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS}`,
);
assert.equal(shouldFocusAiLibrarian(PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS), true);
assert.equal(shouldFocusAiLibrarian("episode"), false);

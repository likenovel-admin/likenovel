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

const longDetailCopy = buildAiLibrarianCopy(fantasyProduct, {
  ...aiBrief,
  hook:
    "전직 검도선수이자 해장국집 사장이 뼈 수집가로 각성해 몬스터의 뼈로 맛과 버프 효과를 지닌 요리를 개발하며 성장하는 이야기입니다.",
  premise:
    "각성자와 게이트가 등장하는 현대 판타지 세계에서 전통 해장국집을 운영하는 주인공이 각성한 뼈 수집가 능력으로 몬스터 재료를 활용한 요리를 개발하며 손님과 동료를 넓혀가는 출발점을 보여줍니다.",
});

assert.equal(longDetailCopy.preview.includes("…"), true);
assert.equal(longDetailCopy.intro.includes("…"), false);
assert.equal(longDetailCopy.points[0].includes("…"), false);
assert.match(longDetailCopy.intro, /성장하는 이야기입니다/);
assert.match(longDetailCopy.points[0], /출발점을 보여줍니다/);

const mixedEndingCopy = buildAiLibrarianCopy(fantasyProduct, {
  ...aiBrief,
  hook:
    "히어로 조직의 리더가 갑작스럽게 은퇴를 선언하자, 동료들이 그를 막기 위해 납치하고 설득하는 과정에서 조직의 비밀과 개인의 트라우마가 드러난다.",
  premise:
    "현대 사회에서 색채를 잃어 자살 직전의 사람들의 무의식을 치유하는 히어로 조직의 리더가 은퇴를 선언하며 숨겨진 진실이 펼쳐진다.",
  protagonistType: "은퇴를 원하는 히어로",
  protagonistGoal: "차원이동",
  mood: "신비롭고 긴장감 있는 분위기",
});

const mixedEndingText = [mixedEndingCopy.intro, ...mixedEndingCopy.points].join(" ");

assert.match(mixedEndingCopy.points[1], /움직여요\./);
assert.doesNotMatch(
  mixedEndingText,
  /움직입니다|가깝습니다|만듭니다|좋습니다/,
);

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

// LLM이 작성한 librarian 카피가 있으면 템플릿 대신 그대로 사용한다
const librarianCopy = buildAiLibrarianCopy(
  { productId: 103, title: "사서 카피 작품", synopsis: "시놉", genre: ["판타지"], keywords: [] },
  {
    productId: 103,
    hook: "훅 문장.",
    premise: "전제 문장.",
    mood: "유쾌한 분위기",
    protagonistGoal: "성장",
    tasteTags: ["머지칩1", "머지칩2"],
    librarianIntro: "사서가 직접 쓴 소개예요.",
    librarianPoints: ["포인트 하나예요.", "포인트 둘이에요.", "포인트 셋이에요."],
    librarianChips: ["먼치킨", "아카데미", "회귀"],
  },
);
assert.equal(librarianCopy.intro, "사서가 직접 쓴 소개예요.");
assert.deepEqual(librarianCopy.points, ["포인트 하나예요.", "포인트 둘이에요.", "포인트 셋이에요."]);
assert.deepEqual(librarianCopy.chips, ["먼치킨", "아카데미", "회귀"]);
assert.equal(librarianCopy.preview.includes("사서가 직접 쓴 소개예요."), true);

// librarian 카피가 없으면 기존 템플릿/머지 fallback
const librarianFallbackCopy = buildAiLibrarianCopy(
  { productId: 104, title: "fallback 작품", synopsis: "시놉", genre: ["판타지"], keywords: [] },
  {
    productId: 104,
    hook: "훅 문장.",
    premise: "전제 문장.",
    mood: "유쾌한 분위기",
    protagonistGoal: "성장",
    tasteTags: ["머지칩1", "머지칩2"],
  },
);
assert.equal(librarianFallbackCopy.intro.includes("훅 문장."), true);
assert.deepEqual(librarianFallbackCopy.chips, ["머지칩1", "머지칩2"]);

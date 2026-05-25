type AiLibrarianProductInput = {
  productId: number;
  title?: string | null;
  synopsis?: string | null;
  genre?: readonly string[] | null;
  keywords?: readonly string[] | null;
};

export type AiProductBrief = {
  productId: number;
  title?: string | null;
  premise?: string | null;
  hook?: string | null;
  mood?: string | null;
  pacing?: string | null;
  protagonistType?: string | null;
  protagonistGoal?: string | null;
  tasteTags?: readonly string[] | null;
  worldviewTags?: readonly string[] | null;
  protagonistTypeTags?: readonly string[] | null;
  protagonistJobTags?: readonly string[] | null;
  protagonistMaterialTags?: readonly string[] | null;
  styleTags?: readonly string[] | null;
  romanceTags?: readonly string[] | null;
};

export type AiLibrarianCopy = {
  preview: string;
  intro: string;
  points: string[];
  chips: string[];
};

export const PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS = "ai-librarian";

const MAX_PREVIEW_LENGTH = 92;
const MAX_CHIPS = 4;

const normalizeText = (value: string | null | undefined) =>
  String(value || "").replace(/\s+/g, " ").trim();

const uniqueValues = (values: readonly string[] | null | undefined) => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values || []) {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};

const clampSentence = (value: string, maxLength: number) => {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const buildBriefCopy = (
  brief: AiProductBrief,
  product: AiLibrarianProductInput
): AiLibrarianCopy | null => {
  const hook = normalizeText(brief.hook);
  const premise = normalizeText(brief.premise);
  if (!hook && !premise) return null;

  const genres = uniqueValues(product.genre);
  const protagonistType = normalizeText(brief.protagonistType);
  const protagonistGoal = normalizeText(brief.protagonistGoal);
  const mood = normalizeText(brief.mood);
  const briefTags = uniqueValues([
    ...(brief.tasteTags || []),
    ...(brief.worldviewTags || []),
    ...(brief.styleTags || []),
    ...(brief.protagonistTypeTags || []),
    ...(brief.protagonistJobTags || []),
    ...(brief.protagonistMaterialTags || []),
    ...(brief.romanceTags || []),
  ]);
  const chips = uniqueValues([...briefTags, ...genres, ...(product.keywords || [])]).slice(
    0,
    MAX_CHIPS
  );
  const tasteLine =
    chips.length > 0
      ? `${chips.slice(0, 3).join(", ")} 결을 좋아하는 독자에게 맞을 수 있어요.`
      : "처음 읽는 독자가 작품의 출발점과 인물의 방향을 잡기 쉬워요.";

  const previewBase = `${clampSentence(hook || premise, 74)} ${
    protagonistGoal
      ? `${protagonistGoal} 축을 따라가면 재미가 선명해요.`
      : mood
      ? `${mood} 결을 좋아하면 잘 맞아요.`
      : "초반 갈등과 인물의 방향이 또렷해요."
  }`;

  const points = [
    premise
      ? `이야기의 출발점은 ${clampSentence(premise, 86)}`
      : `초반 훅은 ${clampSentence(hook, 86)}`,
    protagonistType && protagonistGoal
      ? `주인공은 ${protagonistType} 축으로 ${protagonistGoal}을 향해 움직입니다.`
      : protagonistGoal
      ? `주인공의 동력은 ${protagonistGoal}에 가깝습니다.`
      : mood
      ? `${mood} 분위기가 작품의 첫인상을 만듭니다.`
      : "인물의 목표와 세계의 압박을 따라가며 읽기 좋습니다.",
    tasteLine,
  ];

  return {
    preview: clampSentence(previewBase, MAX_PREVIEW_LENGTH),
    intro: `${clampSentence(hook || premise, 118)}${
      mood ? ` ${mood} 결이 강하게 깔려 있어요.` : ""
    }`,
    points,
    chips,
  };
};

export const buildAiLibrarianCopy = (
  product: AiLibrarianProductInput,
  brief?: AiProductBrief | null
): AiLibrarianCopy => {
  const briefCopy = brief ? buildBriefCopy(brief, product) : null;
  if (briefCopy) return briefCopy;

  const genres = uniqueValues(product.genre);
  const keywords = uniqueValues(product.keywords);
  const chips = [...genres, ...keywords].slice(0, MAX_CHIPS);
  const primaryGenre = genres[0] || "";
  const primaryKeyword = keywords[0] || "";
  const synopsis = normalizeText(product.synopsis);
  const productTitle = normalizeText(product.title);
  const titleLead = productTitle ? `「${productTitle}」은` : "이 작품은";
  const tasteAnchor =
    primaryKeyword && primaryGenre
      ? `${primaryGenre} 안에서 ${primaryKeyword} 포인트`
      : primaryKeyword
      ? `${primaryKeyword} 포인트`
      : primaryGenre
      ? `${primaryGenre} 장르의 기대감`
      : "초반 분위기와 인물의 목표";
  const synopsisSignal = synopsis
    ? "소개글이 던지는 설정을 첫 회차에서 어떻게 갈등으로 연결하는지 보면 좋아요."
    : "초반 회차에서 인물의 방향과 갈등 구조를 먼저 확인해보세요.";

  const intro = synopsis
    ? `${titleLead} ${tasteAnchor}을 먼저 잡고 들어가면 좋은 작품이에요. ${synopsisSignal}`
    : primaryGenre
    ? `${titleLead} ${primaryGenre}의 결을 중심으로, 처음 읽는 독자가 분위기와 인물의 흐름을 잡기 좋게 시작돼요.`
    : `${titleLead} 처음 읽는 독자가 초반 분위기와 인물의 목표를 따라가며 결을 잡기 좋은 편이에요.`;

  const previewBase = synopsis
    ? `${titleLead} ${tasteAnchor}을 먼저 보면 초반 결이 잡혀요.`
    : primaryGenre
    ? `${titleLead} ${primaryGenre} 중심의 흐름이에요. ${
        primaryKeyword
          ? `${primaryKeyword} 포인트를 보고 들어가면 초반 몰입이 쉬워요.`
          : "초반 분위기와 인물의 목표를 따라가며 읽기 좋아요."
      }`
    : `${titleLead} 아직 자세한 소개가 적지만, 초반 분위기와 인물의 목표를 따라가며 읽어볼 만해요.`;

  const synopsisPoint = synopsis
    ? synopsisSignal
    : "작품 설명이 많지 않아도 초반 회차에서 분위기를 먼저 확인하기 좋아요.";

  const points = [
    primaryGenre
      ? `${primaryGenre} 장르의 기대감을 먼저 잡고 들어가면 좋아요.`
      : "초반 분위기와 인물의 목표를 먼저 확인해보세요.",
    primaryKeyword
      ? `${primaryKeyword} 요소를 좋아한다면 입문 장벽이 낮을 수 있어요.`
      : "작품 키워드가 적어도 첫 회차의 갈등 구조를 따라가면 판단하기 쉬워요.",
    synopsisPoint,
  ];

  return {
    preview: clampSentence(previewBase, MAX_PREVIEW_LENGTH),
    intro,
    points,
    chips,
  };
};

export const buildProductDetailAiLibrarianPath = (productId: number) =>
  `/product/${productId}?focus=${PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS}`;

export const shouldFocusAiLibrarian = (value: string | null | undefined) =>
  value === PRODUCT_DETAIL_AI_LIBRARIAN_FOCUS;

// 외부 유통 수집기의 순수 파싱 함수. 매칭 판단은 백엔드 sync API가 소유한다.

export const SERIAL = "serial";
export const SINGLE_VOLUME = "single_volume";

const NON_WORD = /[\s\p{P}\p{S}_]+/gu;

export const normalizeText = (value) =>
  String(value ?? "").normalize("NFKC").replace(NON_WORD, "").toLowerCase();

const bigrams = (value) => {
  const grams = new Map();
  for (let i = 0; i < value.length - 1; i += 1) {
    const gram = value.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return grams;
};

/** 수집 범위를 정할 때만 쓰는 대략적 제목 유사도(Dice). */
export const titleSimilarity = (left, right) => {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const ga = bigrams(a);
  const gb = bigrams(b);
  let overlap = 0;
  for (const [gram, count] of ga) overlap += Math.min(count, gb.get(gram) ?? 0);
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
};

const KAKAO_TAG = /^(?:기다무|3다무|웹소설|웹툰|책|\d+세|무료|연재|기다리면|독점)/;
const KAKAO_STATUS_SUFFIX = /,\s*(?:최신 회차 업데이트됨|신작)\s*$/;
const SINGLE_VOLUME_MARK = /\s*\[단행본\]\s*$/;

/**
 * 카카오페이지 검색 결과 카드의 aria-label을 관측값으로 바꾼다.
 * 예: "작품, 차원의 문: 일곱열매, 최신 회차 업데이트됨, 기다무, 웹소설, 판타지, 작가 김봉진, 조회수 ..."
 * 웹소설이 아니거나 형식을 알 수 없으면 null.
 */
export const parseKakaoLabel = (externalId, label) => {
  const text = String(label ?? "").replace(/\s+/g, " ").trim();
  if (!externalId || !text.startsWith("작품,")) return null;
  if (!/, 웹소설,/.test(text)) return null;
  const author = text.match(/, 작가 (.+?), 조회수/)?.[1]?.trim();
  if (!author) return null;
  const parts = text.slice("작품,".length).split(", ");
  const titleParts = [];
  for (const part of parts) {
    if (titleParts.length > 0 && KAKAO_TAG.test(part.trim())) break;
    titleParts.push(part);
  }
  let title = titleParts.join(", ").trim().replace(KAKAO_STATUS_SUFFIX, "").trim();
  const edition = SINGLE_VOLUME_MARK.test(title) ? SINGLE_VOLUME : SERIAL;
  title = title.replace(SINGLE_VOLUME_MARK, "").trim();
  if (!title) return null;
  return { external_id: String(externalId), title, author, edition };
};

/**
 * 리디 검색 결과 카드를 관측값으로 바꾼다. 라이크노벨 출간작만 남긴다.
 * 연재본은 "총 N화", 단행본(e북)은 "[e북]" 제목과 "총 N권"으로 표시된다.
 */
export const parseRidiCard = ({ externalId, title, authors, publishers, countTexts }) => {
  if (!externalId || !title) return null;
  if (!(publishers ?? []).some((name) => normalizeText(name) === normalizeText("라이크노벨"))) {
    return null;
  }
  const author = (authors ?? []).find((name) => String(name).trim());
  if (!author) return null;
  const rawTitle = String(title).trim();
  const isEbook = /^\[e북\]/.test(rawTitle);
  const isEpisodeSerial = (countTexts ?? []).some((value) => /총\s*[\d,]+\s*화/.test(value));
  return {
    external_id: String(externalId),
    title: rawTitle.replace(/^\[e북\]\s*/, ""),
    author: String(author).trim(),
    edition: !isEbook && isEpisodeSerial ? SERIAL : SINGLE_VOLUME,
  };
};

/** 이미 모은 연재본 관측값에 같은 작가·비슷한 제목이 있으면 작품명 재검색을 생략한다. */
export const isCandidateCovered = (candidate, observations, minSimilarity = 0.6) => {
  const author = normalizeText(candidate.authorName);
  return observations.some(
    (obs) =>
      obs.edition === SERIAL &&
      normalizeText(obs.author) === author &&
      titleSimilarity(obs.title, candidate.title) >= minSimilarity
  );
};

export const dedupeObservations = (observations) => {
  const byId = new Map();
  for (const obs of observations) {
    if (!byId.has(obs.external_id)) byId.set(obs.external_id, obs);
  }
  return [...byId.values()];
};

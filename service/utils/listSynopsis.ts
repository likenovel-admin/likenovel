const MAX_LIST_SYNOPSIS_LENGTH = 160;

/** 리스트 카드용 소개글: 줄바꿈을 공백으로 합쳐 한 문단처럼 흐르게 정규화한다. */
export const normalizeListSynopsis = (synopsis?: string | null) =>
  String(synopsis || "")
    .replace(/\\r\\n/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * line-clamp가 조사 중간에서 끊는 어색함을 줄이려고, 상한 안에서 마지막 문장
 * 종결 부호까지만 남긴다. 종결 부호가 없으면 상한에서 자르고 말줄임표를 붙인다.
 */
export const buildListSynopsisPreview = (synopsis?: string | null) => {
  const normalized = normalizeListSynopsis(synopsis);
  if (!normalized) return "";
  if (normalized.length <= MAX_LIST_SYNOPSIS_LENGTH) return normalized;

  const clampWindow = normalized.slice(0, MAX_LIST_SYNOPSIS_LENGTH);
  const sentenceEnd = Math.max(
    clampWindow.lastIndexOf("."),
    clampWindow.lastIndexOf("!"),
    clampWindow.lastIndexOf("?"),
    clampWindow.lastIndexOf("\u201d"),
    clampWindow.lastIndexOf("\u2019")
  );

  // 너무 앞에서 끊기면 두 줄을 채우지 못하므로 상한 절반 이후의 종결 부호만 쓴다.
  if (sentenceEnd >= MAX_LIST_SYNOPSIS_LENGTH / 2) {
    return clampWindow.slice(0, sentenceEnd + 1);
  }

  return `${clampWindow.trimEnd()}\u2026`;
};

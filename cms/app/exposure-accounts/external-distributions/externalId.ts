export type ExternalIdPlatform = "kakaopage" | "ridi";

const URL_PATTERNS: Record<ExternalIdPlatform, RegExp> = {
  kakaopage: /page\.kakao\.com\/content\/(\d+)/,
  ridi: /ridibooks\.com\/books\/(\d+)/,
};

/** 외부 작품 URL 또는 숫자 ID에서 외부 연재본 ID를 꺼낸다. 알 수 없으면 null. */
export const parseExternalId = (
  platform: ExternalIdPlatform,
  input: string
): string | null => {
  const value = input.trim();
  if (/^\d+$/.test(value)) return value;
  const match = value.match(URL_PATTERNS[platform]);
  return match ? match[1] : null;
};

export const buildExternalUrl = (platform: ExternalIdPlatform, externalId: string) =>
  platform === "kakaopage"
    ? `https://page.kakao.com/content/${externalId}`
    : `https://ridibooks.com/books/${externalId}`;

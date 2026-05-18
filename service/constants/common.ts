export const DEFAULT_PRODUCT_IMAGE = "/images/default-cover.png";
export const ADULT_19_ICON_IMAGE = "/images/adult-19-icon.png";
export const LEGACY_DEFAULT_PRODUCT_IMAGE_KEY = "ESokN0lzSgG0um4rn4tBeg";
export const LEGACY_LOCAL_DEFAULT_PRODUCT_IMAGE = "/images/default_cover.png";
export const isLegacyDefaultProductImage = (imagePath?: string | null) => {
  const normalizedImagePath = imagePath?.trim();
  return Boolean(
    normalizedImagePath?.includes(LEGACY_DEFAULT_PRODUCT_IMAGE_KEY) ||
      normalizedImagePath === LEGACY_LOCAL_DEFAULT_PRODUCT_IMAGE ||
      normalizedImagePath?.endsWith(LEGACY_LOCAL_DEFAULT_PRODUCT_IMAGE)
  );
};
export const resolveProductCoverImage = (imagePath?: string | null) => {
  const normalizedImagePath = imagePath?.trim();
  return !normalizedImagePath ||
    isLegacyDefaultProductImage(normalizedImagePath)
    ? DEFAULT_PRODUCT_IMAGE
    : normalizedImagePath;
};
export const ADMIN_EMAIL = "mailto:admin@likenovel.net";
export const WEBSOCHAT_NAV_LABEL = "웹소챗";
export const WEBSOCHAT_PREPARE_NAV_EVENT = "likenovel:websochat:prepare-nav";
export const WEBSOCHAT_MESSAGE_MAX_LENGTH = 2000;
export const WEBSOCHAT_GHOST_QUESTIONS = [
  "지금까지 떡밥 뭐 남았어?",
  "이번 회차에서 중요한 장면이 뭐야?",
  "주인공이 왜 그렇게 행동했어?",
  "주요 인물 관계를 정리해줘",
  "빌런이나 갈등 구조를 정리해줘",
  "현재 세력 구도를 정리해줘",
  "앞에서 나온 복선이 여기랑 이어져?",
  "이 대사에 숨은 뜻이 있어?",
  "이번 사건이 다음 전개에 어떤 영향 줄까?",
  "누가 흑막일 가능성이 높아?",
  "다음 회차 전개를 예측해줘",
  "읽은 범위에서 중요한 키워드 뽑아줘",
] as const;
export const WEBSOCHAT_GHOST_ROTATE_MS = 3500;
export const WEBSOCHAT_GHOST_FADE_MS = 240;
export const TYPE_MODAL = {
  CASH_USE: "CASH_USE", // modal CacheUseModal
  DONATE: "DONATE", // modal DonateModal
  RENT_OWN: "RENT_OWN", // modal CacheStatusModal
  RENTAL_STATUS: "RENTAL_STATUS", // modal RentalStatusModal
  REPORT_REASON: "REPORT_REASON", // modal ReportReasonModal
};

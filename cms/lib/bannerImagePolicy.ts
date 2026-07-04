const UNIFIED_CAROUSEL_BANNER_POSITIONS = new Set([
  "main-top",
  "companyNotice",
  "paid",
  "review",
]);

const IMAGE_FORMAT_GUIDE = "포맷: jpg|png|gif|webp";

export function usesUnifiedBannerImage(position: string): boolean {
  return UNIFIED_CAROUSEL_BANNER_POSITIONS.has(position);
}

export function getBannerImageSpec(position: string): {
  primary: string;
  mobile: string | null;
} | null {
  if (usesUnifiedBannerImage(position)) {
    return {
      primary: position === "companyNotice" ? "734x367(2:1)" : "364x414",
      mobile: null,
    };
  }
  if (position === "main-mid") return { primary: "1080x116", mobile: null };
  if (position === "viewer") return { primary: "839x122", mobile: "375x122" };
  return null;
}

export function shouldShowMobileBannerImageUpload(position: string): boolean {
  const spec = getBannerImageSpec(position);
  return Boolean(spec?.mobile) && !usesUnifiedBannerImage(position);
}

export function getPrimaryBannerImageGuide(position: string): string {
  const spec = getBannerImageSpec(position);
  return spec ? `권장: ${spec.primary}, ${IMAGE_FORMAT_GUIDE}` : IMAGE_FORMAT_GUIDE;
}

export function getMobileBannerImageGuide(position: string): string {
  const spec = getBannerImageSpec(position);
  return spec?.mobile
    ? `권장: ${spec.mobile}, ${IMAGE_FORMAT_GUIDE}`
    : "이 위치는 모바일 이미지를 사용하지 않습니다";
}

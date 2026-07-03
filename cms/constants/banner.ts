export const bannerPositions = [
  {
    value: "main-top",
    label: "메인 : 대배너(상단 캐러셀)",
    shortLabel: "메인 상단",
  },
  {
    value: "main-mid",
    label: "메인 : 띠배너(중간)",
    shortLabel: "메인 중간",
  },
  {
    value: "main-bot",
    label: "메인 : 고정배너(하단)",
    shortLabel: "메인 하단",
  },
  {
    value: "companyNotice",
    label: "메인 : 미니캐러셀(방금 들어온 무료신작 위)",
    shortLabel: "메인 미니캐러셀",
  },
  { value: "viewer", label: "뷰어", shortLabel: "뷰어" },
  {
    value: "paid",
    label: "메인>유료: 대배너(상단 캐러셀)",
    shortLabel: "유료",
  },
  {
    value: "review",
    label: "메인>작품리뷰: 대배너(상단 캐러셀)",
    shortLabel: "작품리뷰",
  },

  {
    value: "promotion",
    label: "메인>프로모션: 고정배너(상단)",
    shortLabel: "프로모션",
  },
  {
    value: "search",
    label: "검색/검색결과: 고정배너(상단)",
    shortLabel: "검색",
  },
] as const;

export type BannerPositionValue = (typeof bannerPositions)[number]["value"];

export const bannerSortOptions = [
  { value: "show_order_asc", label: "노출순서 1, 2, 3" },
  { value: "show_order_desc", label: "노출순서 3, 2, 1" },
  { value: "latest_updated", label: "최신 수정순" },
] as const;

export type BannerSortOptionValue = (typeof bannerSortOptions)[number]["value"];

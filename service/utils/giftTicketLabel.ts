type GiftTicketLabelParams = {
  promotionType?: string | null;
  acquisitionType?: string | null;
  ticketType?: string | null;
  promotionItemType?: string | null;
};

const PROMOTION_LABEL_MAP: Record<string, string> = {
  "free-for-first": "첫방문자 무료 대여권",
  "reader-of-prev": "선작독자 무료 대여권",
  "waiting-for-free": "기다무 대여권",
  "6-9-path": "6-9패스 대여권",
  "admin-gift": "관리자 지급 대여권",
};

const ACQUISITION_LABEL_MAP: Record<string, string> = {
  event: "이벤트 대여권",
  quest: "퀘스트 대여권",
  admin_direct: "관리자 지급 대여권",
  legacy: "레거시 대여권",
};

export const getGiftTicketLabel = ({
  promotionType,
  acquisitionType,
  ticketType,
  promotionItemType,
}: GiftTicketLabelParams) => {
  const resolvedPromotionType = promotionType || promotionItemType || ticketType;
  if (resolvedPromotionType && PROMOTION_LABEL_MAP[resolvedPromotionType]) {
    return PROMOTION_LABEL_MAP[resolvedPromotionType];
  }

  if (acquisitionType && ACQUISITION_LABEL_MAP[acquisitionType]) {
    return ACQUISITION_LABEL_MAP[acquisitionType];
  }

  return "대여권";
};


export const DEFAULT_PRODUCT_IMAGE = "/images/default-cover.png";
export const ADULT_19_ICON_IMAGE = "/images/adult-19-icon.png";
export const LEGACY_DEFAULT_PRODUCT_IMAGE_KEY = "ESokN0lzSgG0um4rn4tBeg";
export const isLegacyDefaultProductImage = (imagePath?: string | null) =>
  Boolean(imagePath?.includes(LEGACY_DEFAULT_PRODUCT_IMAGE_KEY));
export const resolveProductCoverImage = (imagePath?: string | null) =>
  !imagePath || isLegacyDefaultProductImage(imagePath)
    ? DEFAULT_PRODUCT_IMAGE
    : imagePath;
export const ADMIN_EMAIL = "mailto:admin@likenovel.net";
export const WEBSOCHAT_NAV_LABEL = "웹소챗";
export const TYPE_MODAL = {
  CASH_USE: "CASH_USE", // modal CacheUseModal
  DONATE: "DONATE", // modal DonateModal
  RENT_OWN: "RENT_OWN", // modal CacheStatusModal
  RENTAL_STATUS: "RENTAL_STATUS", // modal RentalStatusModal
  REPORT_REASON: "REPORT_REASON", // modal ReportReasonModal
};

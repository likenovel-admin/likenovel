export const PRODUCTION_SITE_ORIGIN = "https://www.likenovel.net";
export const PRODUCTION_API_ORIGIN = "https://api.likenovel.net";

const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "") || "";

export const getSiteOrigin = () =>
  normalizeOrigin(process.env.NEXT_PUBLIC_WWW_SERVER_URI) ||
  PRODUCTION_SITE_ORIGIN;

export const getApiOrigin = () =>
  normalizeOrigin(process.env.NEXT_PUBLIC_API_SERVER_URI) ||
  PRODUCTION_API_ORIGIN;

export const isIndexableProductionSite = () =>
  normalizeOrigin(process.env.NEXT_PUBLIC_WWW_SERVER_URI) ===
  PRODUCTION_SITE_ORIGIN;

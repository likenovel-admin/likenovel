export const PRODUCTION_SITE_ORIGIN = "https://www.likenovel.net";

const normalizeSiteOrigin = (value) => value?.trim().replace(/\/+$/, "") || "";

export const getSiteOrigin = () =>
  normalizeSiteOrigin(process.env.NEXT_PUBLIC_WWW_SERVER_URI) ||
  PRODUCTION_SITE_ORIGIN;

export const isIndexableProductionSite = () =>
  normalizeSiteOrigin(process.env.NEXT_PUBLIC_WWW_SERVER_URI) ===
  PRODUCTION_SITE_ORIGIN;

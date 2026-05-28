export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  externalReferrerHost: string | null;
  externalReferrerGroup: string | null;
};

export type MarketingAttributionCookiePayload = MarketingAttribution & {
  landingPath: string | null;
};

export const MARKETING_ATTRIBUTION_COOKIE_NAME = "ln_marketing_attribution";
export const MARKETING_ATTRIBUTION_COOKIE_MAX_AGE_SECONDS = 120;
export const MARKETING_ATTRIBUTION_STORAGE_KEY = "ln_site_pv_marketing_attribution";
export const SHORT_TRACKING_QUERY_PARAM = "lns";

const SHORT_LINK_CHANNELS: Record<string, string> = {
  ig: "instagram",
  th: "threads",
  x: "x",
};

const INTERNAL_HOST_SUFFIXES = ["likenovel.net", "likenovel.dev", "localhost"];

function compactText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = (value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, maxLength);
}

function normalizeToken(value: string | null | undefined, maxLength: number): string | null {
  const compacted = compactText(value, maxLength);
  if (!compacted) {
    return null;
  }
  const normalized = compacted
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || null;
}

function normalizeUtmSource(value: string | null | undefined): string | null {
  const source = normalizeToken(value, 80);
  if (!source) {
    return null;
  }
  if (source === "ig") {
    return "instagram";
  }
  if (source === "th") {
    return "threads";
  }
  if (source === "x" || source === "twitter") {
    return "x";
  }
  return source;
}

function normalizeReferrerGroupValue(value: string | null | undefined): string | null {
  const group = normalizeToken(value, 80);
  if (group === "twitter") {
    return "x";
  }
  return group;
}

function stripCommonSubdomain(host: string): string {
  return host.replace(/^(www|m|mobile|l)\./, "");
}

function normalizeReferrerHost(referrer: string | null | undefined): string | null {
  const rawReferrer = compactText(referrer, 512);
  if (!rawReferrer) {
    return null;
  }

  try {
    const parsed = new URL(rawReferrer);
    const host = stripCommonSubdomain(parsed.hostname.toLowerCase());
    if (!host) {
      return null;
    }
    if (host === "t.co") {
      return "t.co";
    }
    if (host === "x.com" || host.endsWith(".x.com")) {
      return "x.com";
    }
    if (host === "twitter.com" || host.endsWith(".twitter.com")) {
      return "twitter.com";
    }
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return "instagram.com";
    }
    if (
      host === "threads.net" ||
      host.endsWith(".threads.net") ||
      host === "threads.com" ||
      host.endsWith(".threads.com")
    ) {
      return host.endsWith(".threads.com") || host === "threads.com"
        ? "threads.com"
        : "threads.net";
    }
    if (host === "naver.com" || host.endsWith(".naver.com")) {
      return "naver.com";
    }
    if (host === "google.com" || host.endsWith(".google.com")) {
      return "google.com";
    }
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

function normalizeCurrentHost(currentHost: string | null | undefined): string | null {
  const host = compactText(currentHost, 255);
  if (!host) {
    return null;
  }
  return stripCommonSubdomain(host.split(":")[0].toLowerCase());
}

function isInternalHost(referrerHost: string | null, currentHost: string | null): boolean {
  if (!referrerHost) {
    return false;
  }
  if (currentHost && referrerHost === currentHost) {
    return true;
  }
  return INTERNAL_HOST_SUFFIXES.some(
    (suffix) => referrerHost === suffix || referrerHost.endsWith(`.${suffix}`)
  );
}

function referrerGroupFromHost(host: string | null): string | null {
  if (!host) {
    return "direct";
  }
  if (host === "t.co" || host === "x.com" || host === "twitter.com") {
    return "x";
  }
  if (host === "instagram.com") {
    return "instagram";
  }
  if (host === "threads.net" || host === "threads.com") {
    return "threads";
  }
  if (host === "naver.com") {
    return "naver";
  }
  if (host === "google.com") {
    return "google";
  }
  return "other";
}

function normalizeShortTrackingCode(code: string | null | undefined): string | null {
  const normalized = normalizeToken(code, 40);
  return normalized || null;
}

function parseShortTrackingCode(code: string): {
  productId: number;
  cardNo: number;
  channel: string;
} | null {
  const normalizedCode = normalizeShortTrackingCode(code);
  if (!normalizedCode) {
    return null;
  }

  const match = /^([a-z]+)([1-9]\d{0,9})c([1-9]\d{0,2})$/i.exec(normalizedCode);
  if (!match) {
    return null;
  }

  const [, rawChannel, rawProductId, rawCardNo] = match;
  const channel = SHORT_LINK_CHANNELS[rawChannel.toLowerCase()];
  if (!channel) {
    return null;
  }

  const productId = Number(rawProductId);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return null;
  }

  const cardNo = Number(rawCardNo);
  if (!Number.isSafeInteger(cardNo) || cardNo <= 0) {
    return null;
  }

  return { productId, cardNo, channel };
}

export function buildShortTrackingAttribution(
  code: string
): MarketingAttributionCookiePayload | null {
  const parsed = parseShortTrackingCode(code);
  if (!parsed) {
    return null;
  }

  const { productId, cardNo, channel } = parsed;
  return {
    utmSource: channel,
    utmMedium: "social",
    utmCampaign: `p${productId}_card`,
    utmContent: `card${String(cardNo).padStart(2, "0")}`,
    externalReferrerHost: null,
    externalReferrerGroup: channel,
    landingPath: `/product/${productId}`,
  };
}

export function buildShortTrackingDestination(code: string): string | null {
  const attribution = buildShortTrackingAttribution(code);
  if (!attribution?.landingPath) {
    return null;
  }
  const normalizedCode = normalizeShortTrackingCode(code);
  if (!normalizedCode) {
    return null;
  }

  const params = new URLSearchParams({
    [SHORT_TRACKING_QUERY_PARAM]: normalizedCode,
  });
  return `${attribution.landingPath}?${params.toString()}`;
}

export function getForwardedRequestOrigin(request: {
  headers: { get(name: string): string | null };
  url: string;
}): string {
  const requestUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ||
    requestUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    requestUrl.host;

  return `${proto}://${host}`;
}

export function buildShortTrackingRedirectUrl(
  code: string,
  request: { headers: { get(name: string): string | null }; url: string }
): string {
  const destination = buildShortTrackingDestination(code) || "/";
  return new URL(destination, getForwardedRequestOrigin(request)).toString();
}

function normalizeLandingPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const path = value.split("?")[0].split("#")[0].trim();
  if (!path || !path.startsWith("/")) {
    return null;
  }
  return path.slice(0, 255);
}

export function parseMarketingAttributionValue(
  rawValue: string | null | undefined
): MarketingAttributionCookiePayload | null {
  if (!rawValue) {
    return null;
  }

  let decoded = rawValue;
  try {
    decoded = decodeURIComponent(rawValue);
  } catch {
    decoded = rawValue;
  }

  try {
    const parsed = JSON.parse(decoded) as Partial<MarketingAttributionCookiePayload>;
    return {
      utmSource: normalizeUtmSource(parsed.utmSource),
      utmMedium: normalizeToken(parsed.utmMedium, 80),
      utmCampaign: normalizeToken(parsed.utmCampaign, 120),
      utmContent: normalizeToken(parsed.utmContent, 120),
      externalReferrerHost:
        typeof parsed.externalReferrerHost === "string"
          ? compactText(parsed.externalReferrerHost, 255)
          : null,
      externalReferrerGroup: normalizeReferrerGroupValue(parsed.externalReferrerGroup),
      landingPath: normalizeLandingPath(parsed.landingPath),
    };
  } catch {
    return null;
  }
}

export function encodeMarketingAttributionCookiePayload(
  attribution: MarketingAttributionCookiePayload
): string {
  return JSON.stringify(attribution);
}

export function getMarketingAttributionCookiePayload(
  cookieHeader: string | null | undefined
): MarketingAttributionCookiePayload | null {
  if (!cookieHeader) {
    return null;
  }

  const cookiePrefix = `${MARKETING_ATTRIBUTION_COOKIE_NAME}=`;
  const rawCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));

  if (!rawCookie) {
    return null;
  }

  return parseMarketingAttributionValue(rawCookie.slice(cookiePrefix.length));
}

export function getShortTrackingMarketingAttributionFromSearch(
  search: string | null | undefined,
  pathname?: string | null | undefined
): MarketingAttributionCookiePayload | null {
  const queryString = (search || "").startsWith("?")
    ? (search || "").slice(1)
    : search || "";
  const params = new URLSearchParams(queryString);
  const attribution = buildShortTrackingAttribution(
    params.get(SHORT_TRACKING_QUERY_PARAM) || ""
  );
  if (!attribution) {
    return null;
  }
  const normalizedPath = normalizeLandingPath(pathname);
  if (normalizedPath && attribution.landingPath !== normalizedPath) {
    return null;
  }
  return attribution;
}

export function stripShortTrackingQueryFromCurrentUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has(SHORT_TRACKING_QUERY_PARAM)) {
    return;
  }

  url.searchParams.delete(SHORT_TRACKING_QUERY_PARAM);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function hasShortTrackingMarketingLandingForPath(
  cookieHeader: string | null | undefined,
  pathname: string | null | undefined
): boolean {
  const payload = getMarketingAttributionCookiePayload(cookieHeader);
  return Boolean(
    payload?.landingPath &&
      normalizeLandingPath(pathname) === payload.landingPath &&
      hasMarketingAttributionSignal(payload)
  );
}

function toMarketingAttribution(
  attribution: MarketingAttribution | MarketingAttributionCookiePayload
): MarketingAttribution {
  return {
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmContent: attribution.utmContent,
    externalReferrerHost: attribution.externalReferrerHost,
    externalReferrerGroup: attribution.externalReferrerGroup,
  };
}

export function resolveSessionMarketingAttribution(input: {
  pathname: string | null | undefined;
  currentAttribution: MarketingAttribution | null;
  cookieAttribution: MarketingAttributionCookiePayload | null;
  storedAttribution: MarketingAttribution | null;
}): MarketingAttribution | null {
  const cookieAttribution = input.cookieAttribution;
  const isCookieLanding = Boolean(
    cookieAttribution?.landingPath &&
      normalizeLandingPath(input.pathname) === cookieAttribution.landingPath
  );

  if (hasUtmAttributionSignal(input.currentAttribution)) {
    return input.currentAttribution;
  }

  if (cookieAttribution && isCookieLanding && hasMarketingAttributionSignal(cookieAttribution)) {
    return toMarketingAttribution(cookieAttribution);
  }

  if (hasMarketingAttributionSignal(input.currentAttribution)) {
    return input.currentAttribution;
  }

  if (cookieAttribution && hasMarketingAttributionSignal(cookieAttribution)) {
    return toMarketingAttribution(cookieAttribution);
  }

  return input.storedAttribution || input.currentAttribution;
}

export function extractMarketingAttribution(input: {
  search: string | null | undefined;
  referrer: string | null | undefined;
  currentHost: string | null | undefined;
  pathname?: string | null | undefined;
}): MarketingAttribution {
  const search = (input.search || "").startsWith("?")
    ? (input.search || "").slice(1)
    : input.search || "";
  const params = new URLSearchParams(search);
  const shortTrackingAttribution = getShortTrackingMarketingAttributionFromSearch(
    search,
    input.pathname
  );
  if (shortTrackingAttribution) {
    return toMarketingAttribution(shortTrackingAttribution);
  }

  const currentHost = normalizeCurrentHost(input.currentHost);
  const referrerHost = normalizeReferrerHost(input.referrer);
  const internalReferrer = isInternalHost(referrerHost, currentHost);
  const externalReferrerHost = internalReferrer ? null : referrerHost;
  const utmSource = normalizeUtmSource(params.get("utm_source"));

  return {
    utmSource,
    utmMedium: normalizeToken(params.get("utm_medium"), 80),
    utmCampaign: normalizeToken(params.get("utm_campaign"), 120),
    utmContent: normalizeToken(params.get("utm_content"), 120),
    externalReferrerHost,
    externalReferrerGroup: utmSource || (internalReferrer ? "internal" : referrerGroupFromHost(externalReferrerHost)),
  };
}

export function hasMarketingAttributionSignal(
  attribution: MarketingAttribution | null | undefined
): boolean {
  if (!attribution) {
    return false;
  }
  if (hasUtmAttributionSignal(attribution)) {
    return true;
  }
  return Boolean(
    attribution.externalReferrerHost &&
      attribution.externalReferrerGroup &&
      !["direct", "internal"].includes(attribution.externalReferrerGroup)
  );
}

function hasUtmAttributionSignal(
  attribution: MarketingAttribution | null | undefined
): boolean {
  return Boolean(
    attribution?.utmSource ||
      attribution?.utmMedium ||
      attribution?.utmCampaign ||
      attribution?.utmContent
  );
}

export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  externalReferrerHost: string | null;
  externalReferrerGroup: string | null;
};

const SHORT_LINK_CHANNELS: Record<string, string> = {
  ig: "instagram",
  th: "threads",
  x: "twitter",
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
  if (source === "x") {
    return "twitter";
  }
  return source;
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
    if (host === "threads.net" || host.endsWith(".threads.net")) {
      return "threads.net";
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
    return "twitter";
  }
  if (host === "instagram.com") {
    return "instagram";
  }
  if (host === "threads.net") {
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

export function buildShortTrackingDestination(code: string): string | null {
  const match = /^([a-z]+)([1-9]\d{0,9})c([1-9]\d{0,2})$/i.exec(code.trim());
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

  const params = new URLSearchParams({
    utm_source: channel,
    utm_medium: "social",
    utm_campaign: `p${productId}_card`,
    utm_content: `card${String(cardNo).padStart(2, "0")}`,
  });

  return `/product/${productId}?${params.toString()}`;
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

export function extractMarketingAttribution(input: {
  search: string | null | undefined;
  referrer: string | null | undefined;
  currentHost: string | null | undefined;
}): MarketingAttribution {
  const search = (input.search || "").startsWith("?")
    ? (input.search || "").slice(1)
    : input.search || "";
  const params = new URLSearchParams(search);
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
  if (
    attribution.utmSource ||
    attribution.utmMedium ||
    attribution.utmCampaign ||
    attribution.utmContent
  ) {
    return true;
  }
  return Boolean(
    attribution.externalReferrerHost &&
      attribution.externalReferrerGroup &&
      !["direct", "internal"].includes(attribution.externalReferrerGroup)
  );
}

export type FunnelResumeReason = "login" | "payment";
export type FunnelResumeOriginPageType = "product_detail" | "viewer";

export interface FunnelResumePayload {
  v: 1;
  token: string;
  productId: number;
  reason: FunnelResumeReason;
  originPageType: FunnelResumeOriginPageType;
  originEpisodeId?: number;
  returnPath: string;
  issuedAt: number;
  expiresAt: number;
}

export interface FunnelResumeInput {
  productId: number;
  reason: FunnelResumeReason;
  originPageType: FunnelResumeOriginPageType;
  originEpisodeId?: number;
  returnPath: string;
  ttlMinutes?: number;
}

export const FUNNEL_RESUME_PARAM = "lnr";
const DEFAULT_TTL_MINUTES = 60;
type SearchParamsLike = {
  get: (name: string) => string | null;
};

const getBaseOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://likenovel.local";
};

const toUrl = (pathOrUrl: string) => new URL(pathOrUrl, getBaseOrigin());
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const formatPathOrUrl = (original: string, url: URL) =>
  isAbsoluteHttpUrl(original)
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;

const base64UrlEncode = (value: string) => {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(value)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(padded)));
  }

  return Buffer.from(padded, "base64").toString("utf-8");
};

const createToken = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lnr-${Date.now()}`;
};

export const sanitizeInternalPath = (path: string) => {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }
  return path;
};

export const stripFunnelResumeFromPath = (pathOrUrl: string) => {
  const url = toUrl(pathOrUrl);
  url.searchParams.delete(FUNNEL_RESUME_PARAM);
  return formatPathOrUrl(pathOrUrl, url);
};

export const getCurrentInternalPath = (search?: string) => {
  if (typeof window === "undefined") {
    return "/";
  }

  const rawPath = `${window.location.pathname}${search ?? window.location.search}${window.location.hash}`;
  return stripFunnelResumeFromPath(rawPath);
};

export const getOriginPageTypeFromPathname = (
  pathname: string
): FunnelResumeOriginPageType =>
  pathname.startsWith("/viewer/") ? "viewer" : "product_detail";

export const getEpisodeIdFromViewerPathname = (pathname: string) => {
  if (!pathname.startsWith("/viewer/")) return undefined;
  const episodeId = Number(pathname.split("/").pop());
  return Number.isFinite(episodeId) && episodeId > 0 ? episodeId : undefined;
};

export const createFunnelResumePayload = (
  input: FunnelResumeInput
): FunnelResumePayload => {
  const issuedAt = Date.now();
  const ttlMinutes = input.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  return {
    v: 1,
    token: createToken(),
    productId: input.productId,
    reason: input.reason,
    originPageType: input.originPageType,
    originEpisodeId: input.originEpisodeId,
    returnPath: stripFunnelResumeFromPath(sanitizeInternalPath(input.returnPath)),
    issuedAt,
    expiresAt: issuedAt + ttlMinutes * 60 * 1000,
  };
};

export const encodeFunnelResumePayload = (payload: FunnelResumePayload) =>
  base64UrlEncode(JSON.stringify(payload));

export const decodeFunnelResumePayload = (
  encoded: string | null | undefined
): FunnelResumePayload | null => {
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded));
    if (parsed?.v !== 1) return null;
    if (!parsed?.productId || !parsed?.reason || !parsed?.originPageType) {
      return null;
    }
    if (!parsed?.returnPath || !parsed?.issuedAt || !parsed?.expiresAt) {
      return null;
    }

    return {
      ...parsed,
      returnPath: sanitizeInternalPath(parsed.returnPath),
    } as FunnelResumePayload;
  } catch {
    return null;
  }
};

export const isValidFunnelResumePayload = (
  payload: FunnelResumePayload | null
) => {
  if (!payload) return false;
  if (payload.expiresAt < Date.now()) return false;
  if (!payload.productId || !payload.reason || !payload.originPageType) {
    return false;
  }
  return true;
};

export const appendFunnelResumeToPath = (
  pathOrUrl: string,
  input: FunnelResumeInput
) => {
  const url = toUrl(pathOrUrl);
  const payload = createFunnelResumePayload(input);
  url.searchParams.set(FUNNEL_RESUME_PARAM, encodeFunnelResumePayload(payload));
  return formatPathOrUrl(pathOrUrl, url);
};

export const appendExistingFunnelResumeToPath = (
  pathOrUrl: string,
  encodedResume: string | null | undefined
) => {
  if (!encodedResume) return pathOrUrl;
  const url = toUrl(pathOrUrl);
  url.searchParams.set(FUNNEL_RESUME_PARAM, encodedResume);
  return formatPathOrUrl(pathOrUrl, url);
};

export const getFunnelResumeParamFromSearchParams = (
  searchParams: SearchParamsLike
) => searchParams.get(FUNNEL_RESUME_PARAM);

export const getFunnelResumeReturnPath = (
  searchParams: SearchParamsLike
) => {
  const payload = decodeFunnelResumePayload(
    getFunnelResumeParamFromSearchParams(searchParams)
  );
  if (!isValidFunnelResumePayload(payload)) {
    return null;
  }
  return payload?.returnPath ?? null;
};

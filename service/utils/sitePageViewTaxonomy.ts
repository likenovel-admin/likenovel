import type { MarketingAttribution } from "./marketingAttribution";

export const SITE_PAGE_VIEW_TAXONOMY_VERSION = 1;

export type SitePageViewRouteGroup =
  | "home"
  | "viewer"
  | "product_detail"
  | "search"
  | "ranking"
  | "websochat"
  | "event"
  | "promotion"
  | "review"
  | "quest"
  | "notice"
  | "faq"
  | "mypage"
  | "auth"
  | "payment"
  | "author"
  | "legal"
  | "system"
  | "catalog"
  | "support"
  | "message"
  | "preference"
  | "present"
  | "vote"
  | "unknown";

export type SitePageViewRouteMeta = {
  routeGroup: SitePageViewRouteGroup;
  routeName: string;
  pathTemplate: string;
};

export type BuildSitePageViewPayloadInput = {
  pathname: string;
  search?: string;
  referrerPath?: string | null;
  visitorId: string;
  sessionId: string;
  eventId: string;
  occurredAt: string;
  marketingAttribution?: MarketingAttribution | null;
};

export type SitePageViewPayload = {
  eventId: string;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  routeGroup: SitePageViewRouteGroup;
  routeName: string;
  pathTemplate: string;
  path: string;
  queryHash: string | null;
  referrerPath: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  externalReferrerHost: string | null;
  externalReferrerGroup: string | null;
  source: "service-web";
  taxonomyVersion: number;
};

export const SITE_PAGE_DWELL_MIN_ACTIVE_MS = 1000;
export const SITE_PAGE_DWELL_MAX_ACTIVE_MS = 30 * 60 * 1000;

const sitePageDwellTrackedRouteGroups = new Set<SitePageViewRouteGroup>([
  "home",
  "viewer",
  "product_detail",
  "search",
  "ranking",
  "websochat",
  "event",
  "promotion",
  "review",
  "quest",
  "notice",
  "faq",
  "catalog",
  "author",
  "legal",
  "vote",
]);

export type BuildSitePageDwellPayloadInput = {
  pathname: string;
  visitorId: string;
  sessionId: string;
  eventId: string;
  occurredAt: string;
  activeMs: number;
};

export type SitePageDwellPayload = {
  eventId: string;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  routeGroup: SitePageViewRouteGroup;
  routeName: string;
  pathTemplate: string;
  activeMs: number;
  source: "service-web";
  taxonomyVersion: number;
};

const numberSegment = "\\d+";

const routeRules: Array<{ pattern: RegExp; meta: SitePageViewRouteMeta }> = [
  { pattern: /^\/$/, meta: { routeGroup: "home", routeName: "home", pathTemplate: "/" } },
  { pattern: new RegExp(`^/viewer/${numberSegment}$`), meta: { routeGroup: "viewer", routeName: "viewer_episode", pathTemplate: "/viewer/[id]" } },
  { pattern: new RegExp(`^/product/${numberSegment}$`), meta: { routeGroup: "product_detail", routeName: "product_detail", pathTemplate: "/product/[id]" } },
  { pattern: /^\/product\/search\/result\/normal$/, meta: { routeGroup: "search", routeName: "search_normal", pathTemplate: "/product/search/result/normal" } },
  { pattern: /^\/product\/search\/result\/story$/, meta: { routeGroup: "search", routeName: "search_story", pathTemplate: "/product/search/result/story" } },
  { pattern: /^\/product\/top50(\/.*)?$/, meta: { routeGroup: "ranking", routeName: "top50", pathTemplate: "/product/top50/*" } },
  { pattern: /^\/websochat(\/.*)?$/, meta: { routeGroup: "websochat", routeName: "websochat", pathTemplate: "/websochat" } },
  { pattern: /^\/product\/event$/, meta: { routeGroup: "event", routeName: "event_list", pathTemplate: "/product/event" } },
  { pattern: new RegExp(`^/product/event/${numberSegment}$`), meta: { routeGroup: "event", routeName: "event_detail", pathTemplate: "/product/event/[id]" } },
  { pattern: /^\/product\/promotion(\/.*)?$/, meta: { routeGroup: "promotion", routeName: "promotion", pathTemplate: "/product/promotion/*" } },
  { pattern: /^\/product\/author\/promotion(\/.*)?$/, meta: { routeGroup: "promotion", routeName: "author_promotion", pathTemplate: "/product/author/promotion/*" } },
  { pattern: /^\/product\/review(\/.*)?$/, meta: { routeGroup: "review", routeName: "review", pathTemplate: "/product/review/*" } },
  { pattern: /^\/review(\/.*)?$/, meta: { routeGroup: "review", routeName: "review", pathTemplate: "/review/*" } },
  { pattern: /^\/product\/quest(\/.*)?$/, meta: { routeGroup: "quest", routeName: "quest", pathTemplate: "/product/quest/*" } },
  { pattern: /^\/product\/customer-service\/notice$/, meta: { routeGroup: "notice", routeName: "notice_list", pathTemplate: "/product/customer-service/notice" } },
  { pattern: new RegExp(`^/product/customer-service/notice/${numberSegment}$`), meta: { routeGroup: "notice", routeName: "notice_detail", pathTemplate: "/product/customer-service/notice/[noticeId]" } },
  { pattern: /^\/product\/customer-service\/faq$/, meta: { routeGroup: "faq", routeName: "faq", pathTemplate: "/product/customer-service/faq" } },
  { pattern: /^\/product\/customer-service\/inquiry$/, meta: { routeGroup: "support", routeName: "inquiry", pathTemplate: "/product/customer-service/inquiry" } },
  { pattern: /^\/product\/free(\/.*)?$/, meta: { routeGroup: "catalog", routeName: "free_list", pathTemplate: "/product/free/*" } },
  { pattern: /^\/product\/paid$/, meta: { routeGroup: "catalog", routeName: "paid_list", pathTemplate: "/product/paid" } },
  { pattern: /^\/product\/mypage\/cash(\/.*)?$/, meta: { routeGroup: "payment", routeName: "mypage_cash", pathTemplate: "/product/mypage/cash/*" } },
  { pattern: /^\/product\/mypage(\/.*)?$/, meta: { routeGroup: "mypage", routeName: "mypage", pathTemplate: "/product/mypage/*" } },
  { pattern: /^\/notification$/, meta: { routeGroup: "mypage", routeName: "notification", pathTemplate: "/notification" } },
  { pattern: /^\/product\/notification$/, meta: { routeGroup: "mypage", routeName: "notification", pathTemplate: "/product/notification" } },
  { pattern: /^\/product\/message(\/.*)?$/, meta: { routeGroup: "message", routeName: "message", pathTemplate: "/product/message/*" } },
  { pattern: /^\/product\/preference(\/.*)?$/, meta: { routeGroup: "preference", routeName: "preference", pathTemplate: "/product/preference/*" } },
  { pattern: /^\/product\/present(\/.*)?$/, meta: { routeGroup: "present", routeName: "present", pathTemplate: "/product/present/*" } },
  { pattern: /^\/product\/vote(\/.*)?$/, meta: { routeGroup: "vote", routeName: "vote", pathTemplate: "/product/vote/*" } },
  { pattern: /^\/login$/, meta: { routeGroup: "auth", routeName: "login", pathTemplate: "/login" } },
  { pattern: /^\/sign-up(\/.*)?$/, meta: { routeGroup: "auth", routeName: "signup", pathTemplate: "/sign-up/*" } },
  { pattern: /^\/find-id$/, meta: { routeGroup: "auth", routeName: "find_id", pathTemplate: "/find-id" } },
  { pattern: /^\/find-id-(ok|fail)$/, meta: { routeGroup: "auth", routeName: "find_id_result", pathTemplate: "/find-id-[result]" } },
  { pattern: /^\/find-password$/, meta: { routeGroup: "auth", routeName: "find_password", pathTemplate: "/find-password" } },
  { pattern: /^\/reset-password$/, meta: { routeGroup: "auth", routeName: "reset_password", pathTemplate: "/reset-password" } },
  { pattern: /^\/auth\/nice(\/.*)?$/, meta: { routeGroup: "auth", routeName: "nice_auth", pathTemplate: "/auth/nice/*" } },
  { pattern: /^\/order\/payment\/complete$/, meta: { routeGroup: "payment", routeName: "payment_complete", pathTemplate: "/order/payment/complete" } },
  { pattern: /^\/product\/author(\/.*)?$/, meta: { routeGroup: "author", routeName: "author", pathTemplate: "/product/author/*" } },
  { pattern: /^\/making-episode(\/.*)?$/, meta: { routeGroup: "author", routeName: "making_episode", pathTemplate: "/making-episode/*" } },
  { pattern: /^\/product\/agree(\/.*)?$/, meta: { routeGroup: "legal", routeName: "legal", pathTemplate: "/product/agree/*" } },
  { pattern: /^\/status$/, meta: { routeGroup: "system", routeName: "status", pathTemplate: "/status" } },
  { pattern: /^\/storage-relay$/, meta: { routeGroup: "system", routeName: "storage_relay", pathTemplate: "/storage-relay" } },
];

export function sanitizeSitePageViewPath(path: string | null | undefined): string {
  const rawPath = path || "/";
  const cleanPath = rawPath.split("?")[0].split("#")[0] || "/";
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

export function shouldTrackSitePageViewPath(pathname: string): boolean {
  const path = sanitizeSitePageViewPath(pathname);
  return !path.startsWith("/api/") && !path.startsWith("/_next/");
}

export function getSitePageViewRouteMeta(pathname: string): SitePageViewRouteMeta {
  const path = sanitizeSitePageViewPath(pathname);
  const matchedRule = routeRules.find((rule) => rule.pattern.test(path));
  if (matchedRule) {
    return matchedRule.meta;
  }
  return {
    routeGroup: "unknown",
    routeName: "unknown",
    pathTemplate: path,
  };
}

export function buildSitePageViewPayload(
  input: BuildSitePageViewPayloadInput
): SitePageViewPayload {
  const path = sanitizeSitePageViewPath(input.pathname);
  const meta = getSitePageViewRouteMeta(path);
  const attribution = input.marketingAttribution;
  return {
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    routeGroup: meta.routeGroup,
    routeName: meta.routeName,
    pathTemplate: meta.pathTemplate,
    path,
    queryHash: null,
    referrerPath: input.referrerPath ? sanitizeSitePageViewPath(input.referrerPath) : null,
    utmSource: attribution?.utmSource ?? null,
    utmMedium: attribution?.utmMedium ?? null,
    utmCampaign: attribution?.utmCampaign ?? null,
    utmContent: attribution?.utmContent ?? null,
    externalReferrerHost: attribution?.externalReferrerHost ?? null,
    externalReferrerGroup: attribution?.externalReferrerGroup ?? null,
    source: "service-web",
    taxonomyVersion: SITE_PAGE_VIEW_TAXONOMY_VERSION,
  };
}

export function shouldTrackSitePageDwellPath(pathname: string): boolean {
  if (!shouldTrackSitePageViewPath(pathname)) {
    return false;
  }
  const meta = getSitePageViewRouteMeta(pathname);
  return sitePageDwellTrackedRouteGroups.has(meta.routeGroup);
}

export function normalizeSitePageDwellActiveMs(activeMs: number): number | null {
  if (!Number.isFinite(activeMs) || activeMs < SITE_PAGE_DWELL_MIN_ACTIVE_MS) {
    return null;
  }
  return Math.min(Math.round(activeMs), SITE_PAGE_DWELL_MAX_ACTIVE_MS);
}

export function buildSitePageDwellPayload(
  input: BuildSitePageDwellPayloadInput
): SitePageDwellPayload | null {
  if (!shouldTrackSitePageDwellPath(input.pathname)) {
    return null;
  }

  const activeMs = normalizeSitePageDwellActiveMs(input.activeMs);
  if (activeMs == null) {
    return null;
  }

  const meta = getSitePageViewRouteMeta(input.pathname);
  return {
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    routeGroup: meta.routeGroup,
    routeName: meta.routeName,
    pathTemplate: meta.pathTemplate,
    activeMs,
    source: "service-web",
    taxonomyVersion: SITE_PAGE_VIEW_TAXONOMY_VERSION,
  };
}

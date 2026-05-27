import assert from "node:assert/strict";
import {
  buildSitePageViewPayload,
  getSitePageViewRouteMeta,
  sanitizeSitePageViewPath,
  shouldTrackSitePageViewPath,
} from "./sitePageViewTaxonomy.ts";

{
  const meta = getSitePageViewRouteMeta("/");
  assert.equal(meta.routeGroup, "home");
  assert.equal(meta.routeName, "home");
  assert.equal(meta.pathTemplate, "/");
}

{
  const meta = getSitePageViewRouteMeta("/viewer/22051");
  assert.equal(meta.routeGroup, "viewer");
  assert.equal(meta.routeName, "viewer_episode");
  assert.equal(meta.pathTemplate, "/viewer/[id]");
}

{
  const meta = getSitePageViewRouteMeta("/product/event/7");
  assert.equal(meta.routeGroup, "event");
  assert.equal(meta.routeName, "event_detail");
  assert.equal(meta.pathTemplate, "/product/event/[id]");
}

{
  const meta = getSitePageViewRouteMeta("/product/customer-service/faq");
  assert.equal(meta.routeGroup, "faq");
  assert.equal(meta.routeName, "faq");
  assert.equal(meta.pathTemplate, "/product/customer-service/faq");
}

{
  const meta = getSitePageViewRouteMeta("/product/mypage/cash");
  assert.equal(meta.routeGroup, "payment");
  assert.equal(meta.routeName, "mypage_cash");
  assert.equal(meta.pathTemplate, "/product/mypage/cash/*");
}

{
  const meta = getSitePageViewRouteMeta("/product/free/free");
  assert.equal(meta.routeGroup, "catalog");
  assert.equal(meta.routeName, "free_list");
  assert.equal(meta.pathTemplate, "/product/free/*");
}

{
  const meta = getSitePageViewRouteMeta("/product/paid");
  assert.equal(meta.routeGroup, "catalog");
  assert.equal(meta.routeName, "paid_list");
  assert.equal(meta.pathTemplate, "/product/paid");
}

{
  const meta = getSitePageViewRouteMeta("/product/customer-service/inquiry");
  assert.equal(meta.routeGroup, "support");
  assert.equal(meta.routeName, "inquiry");
  assert.equal(meta.pathTemplate, "/product/customer-service/inquiry");
}

{
  const meta = getSitePageViewRouteMeta("/product/message");
  assert.equal(meta.routeGroup, "message");
  assert.equal(meta.routeName, "message");
  assert.equal(meta.pathTemplate, "/product/message/*");
}

{
  const meta = getSitePageViewRouteMeta("/auth/nice/callback");
  assert.equal(meta.routeGroup, "auth");
  assert.equal(meta.routeName, "nice_auth");
  assert.equal(meta.pathTemplate, "/auth/nice/*");
}

{
  const meta = getSitePageViewRouteMeta("/new-feature/path");
  assert.equal(meta.routeGroup, "unknown");
  assert.equal(meta.routeName, "unknown");
  assert.equal(meta.pathTemplate, "/new-feature/path");
}

{
  assert.equal(sanitizeSitePageViewPath("/product/1?token=secret#section"), "/product/1");
  assert.equal(sanitizeSitePageViewPath("product/1"), "/product/1");
}

{
  assert.equal(shouldTrackSitePageViewPath("/_next/static/chunk.js"), false);
  assert.equal(shouldTrackSitePageViewPath("/api/v1/query/statistics/site"), false);
  assert.equal(shouldTrackSitePageViewPath("/product/1"), true);
}

{
  const payload = buildSitePageViewPayload({
    pathname: "/product/search/result/normal",
    search: "?keyword=secret",
    referrerPath: "/",
    visitorId: "pv_visitor",
    sessionId: "pvs_session",
    eventId: "9e6c64d6-9222-4546-a7ef-8699f89e2d26",
    occurredAt: "2026-05-21T12:34:56.789+09:00",
  });

  assert.equal(payload.routeGroup, "search");
  assert.equal(payload.routeName, "search_normal");
  assert.equal(payload.path, "/product/search/result/normal");
  assert.equal(payload.queryHash, null);
  assert.equal(payload.source, "service-web");
  assert.equal(payload.taxonomyVersion, 1);
}

{
  const payload = buildSitePageViewPayload({
    pathname: "/product/1109",
    search: "?utm_source=instagram",
    referrerPath: null,
    visitorId: "pv_visitor",
    sessionId: "pvs_session",
    eventId: "1ab1ef4f-a433-4777-a4a9-0d1ab2983b1a",
    occurredAt: "2026-05-27T18:00:00.000+09:00",
    marketingAttribution: {
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "p1109_card",
      utmContent: "card01",
      externalReferrerHost: "instagram.com",
      externalReferrerGroup: "instagram",
    },
  });

  assert.equal(payload.routeGroup, "product_detail");
  assert.equal(payload.utmSource, "instagram");
  assert.equal(payload.utmMedium, "social");
  assert.equal(payload.utmCampaign, "p1109_card");
  assert.equal(payload.utmContent, "card01");
  assert.equal(payload.externalReferrerHost, "instagram.com");
  assert.equal(payload.externalReferrerGroup, "instagram");
}

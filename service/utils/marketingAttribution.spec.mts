import assert from "node:assert/strict";
import {
  buildShortTrackingRedirectUrl,
  buildShortTrackingDestination,
  buildShortTrackingAttribution,
  encodeMarketingAttributionCookiePayload,
  extractMarketingAttribution,
  getMarketingAttributionCookiePayload,
  hasShortTrackingMarketingLandingForPath,
  resolveSessionMarketingAttribution,
  MARKETING_ATTRIBUTION_COOKIE_NAME,
} from "./marketingAttribution.ts";

{
  const destination = buildShortTrackingDestination("ig1109c1");

  assert.equal(
    destination,
    "/product/1109"
  );
}

{
  const destination = buildShortTrackingDestination("th1109c12");

  assert.equal(
    destination,
    "/product/1109"
  );
}

{
  const destination = buildShortTrackingDestination("x1109c1");

  assert.equal(
    destination,
    "/product/1109"
  );
}

{
  const attribution = buildShortTrackingAttribution("x1126c1");

  assert.deepEqual(attribution, {
    utmSource: "x",
    utmMedium: "social",
    utmCampaign: "p1126_card",
    utmContent: "card01",
    externalReferrerHost: null,
    externalReferrerGroup: "x",
    landingPath: "/product/1126",
  });
}

{
  const attribution = buildShortTrackingAttribution("ig1117c1");

  assert.deepEqual(attribution, {
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "p1117_card",
    utmContent: "card01",
    externalReferrerHost: null,
    externalReferrerGroup: "instagram",
    landingPath: "/product/1117",
  });
}

{
  assert.equal(buildShortTrackingDestination("xx1109c1"), null);
  assert.equal(buildShortTrackingDestination("ig0c1"), null);
  assert.equal(buildShortTrackingDestination("ig1109c0"), null);
}

{
  const redirectUrl = buildShortTrackingRedirectUrl("ig1117c1", {
    url: "https://0.0.0.0:3000/r/ig1117c1",
    headers: {
      get(name: string) {
        return {
          "x-forwarded-proto": "https",
          "x-forwarded-host": "likenovel.net",
          host: "0.0.0.0:3000",
        }[name.toLowerCase()] || null;
      },
    },
  });

  assert.equal(
    redirectUrl,
    "https://likenovel.net/product/1117"
  );
}

{
  const attribution = buildShortTrackingAttribution("ig1117c1");
  assert.ok(attribution);

  const cookieValue = encodeMarketingAttributionCookiePayload(attribution);
  const cookieHeader = `${MARKETING_ATTRIBUTION_COOKIE_NAME}=${cookieValue}; other=value`;
  const parsed = getMarketingAttributionCookiePayload(cookieHeader);

  assert.deepEqual(parsed, attribution);
  assert.equal(
    hasShortTrackingMarketingLandingForPath(cookieHeader, "/product/1117"),
    true
  );
  assert.equal(
    hasShortTrackingMarketingLandingForPath(cookieHeader, "/product/1118"),
    false
  );
}

{
  const redirectUrl = buildShortTrackingRedirectUrl("invalid", {
    url: "https://0.0.0.0:3000/r/invalid",
    headers: {
      get(name: string) {
        return {
          "x-forwarded-proto": "https",
          "x-forwarded-host": "likenovel.net",
          host: "0.0.0.0:3000",
        }[name.toLowerCase()] || null;
      },
    },
  });

  assert.equal(redirectUrl, "https://likenovel.net/");
}

{
  const attribution = extractMarketingAttribution({
    search:
      "?utm_source=Instagram&utm_medium=social&utm_campaign=p1109_card&utm_content=card01",
    referrer: "https://l.instagram.com/?u=https%3A%2F%2Flikenovel.net",
    currentHost: "likenovel.net",
  });

  assert.deepEqual(attribution, {
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "p1109_card",
    utmContent: "card01",
    externalReferrerHost: "instagram.com",
    externalReferrerGroup: "instagram",
  });
}

{
  const attribution = extractMarketingAttribution({
    search: "",
    referrer: "https://t.co/abc123",
    currentHost: "www.likenovel.net",
  });

  assert.equal(attribution.utmSource, null);
  assert.equal(attribution.externalReferrerHost, "t.co");
  assert.equal(attribution.externalReferrerGroup, "x");
}

{
  const attribution = extractMarketingAttribution({
    search: "?utm_source=Twitter&utm_medium=social",
    referrer: "https://t.co/abc123",
    currentHost: "www.likenovel.net",
  });

  assert.equal(attribution.utmSource, "x");
  assert.equal(attribution.externalReferrerGroup, "x");
}

{
  const attribution = extractMarketingAttribution({
    search: "",
    referrer: "https://threads.com/@likenovel/post/abc",
    currentHost: "www.likenovel.net",
  });

  assert.equal(attribution.externalReferrerHost, "threads.com");
  assert.equal(attribution.externalReferrerGroup, "threads");
}

{
  const cookieHeader = `${MARKETING_ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify({
      utmSource: "twitter",
      utmMedium: "social",
      utmCampaign: "p1126_card",
      utmContent: "card01",
      externalReferrerHost: "t.co",
      externalReferrerGroup: "twitter",
      landingPath: "/product/1126",
    })
  )}`;
  const parsed = getMarketingAttributionCookiePayload(cookieHeader);

  assert.equal(parsed?.utmSource, "x");
  assert.equal(parsed?.externalReferrerGroup, "x");
}

{
  const selected = resolveSessionMarketingAttribution({
    pathname: "/product/1126",
    currentAttribution: {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      externalReferrerHost: "t.co",
      externalReferrerGroup: "x",
    },
    cookieAttribution: {
      utmSource: "x",
      utmMedium: "social",
      utmCampaign: "p1126_card",
      utmContent: "card01",
      externalReferrerHost: null,
      externalReferrerGroup: "x",
      landingPath: "/product/1126",
    },
    storedAttribution: null,
  });

  assert.deepEqual(selected, {
    utmSource: "x",
    utmMedium: "social",
    utmCampaign: "p1126_card",
    utmContent: "card01",
    externalReferrerHost: null,
    externalReferrerGroup: "x",
  });
}

{
  const selected = resolveSessionMarketingAttribution({
    pathname: "/product/1126",
    currentAttribution: {
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "p1126_card",
      utmContent: "card02",
      externalReferrerHost: "instagram.com",
      externalReferrerGroup: "instagram",
    },
    cookieAttribution: {
      utmSource: "x",
      utmMedium: "social",
      utmCampaign: "p1126_card",
      utmContent: "card01",
      externalReferrerHost: null,
      externalReferrerGroup: "x",
      landingPath: "/product/1126",
    },
    storedAttribution: null,
  });

  assert.deepEqual(selected, {
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "p1126_card",
    utmContent: "card02",
    externalReferrerHost: "instagram.com",
    externalReferrerGroup: "instagram",
  });
}

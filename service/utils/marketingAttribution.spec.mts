import assert from "node:assert/strict";
import {
  buildShortTrackingRedirectUrl,
  buildShortTrackingDestination,
  buildShortTrackingAttribution,
  encodeMarketingAttributionCookiePayload,
  extractMarketingAttribution,
  getMarketingAttributionCookiePayload,
  hasShortTrackingMarketingLandingForPath,
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
  assert.equal(attribution.externalReferrerGroup, "twitter");
}

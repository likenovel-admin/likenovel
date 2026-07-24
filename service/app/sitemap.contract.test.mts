import assert from "node:assert/strict";

const siteOrigin = "https://www.likenovel.net";
const staticUrls = [
  `${siteOrigin}/`,
  `${siteOrigin}/product/top50/free-top`,
  `${siteOrigin}/product/top50/paid-top`,
  `${siteOrigin}/product/free/normal`,
  `${siteOrigin}/product/paid`,
  `${siteOrigin}/product/character-chat`,
  `${siteOrigin}/websochat`,
];
const originalFetch = globalThis.fetch;
const originalSiteUrl = process.env.NEXT_PUBLIC_WWW_SERVER_URI;
const originalApiUrl = process.env.NEXT_PUBLIC_API_SERVER_URI;
const originalConsoleError = console.error;

try {
  process.env.NEXT_PUBLIC_WWW_SERVER_URI = siteOrigin;
  process.env.NEXT_PUBLIC_API_SERVER_URI = "https://api.likenovel.net/";

  const fetchCalls: Array<{ input: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    fetchCalls.push({ input: String(input), init });
    return new Response(
      JSON.stringify({
        data: [
          {
            productId: 1214,
            lastModified: "2026-07-24",
          },
          {
            productId: 1215,
            lastModified: null,
          },
          {
            productId: 1214,
            lastModified: "2026-07-24",
          },
          {
            productId: 0,
            lastModified: "invalid",
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  const [{ default: robots }, { default: sitemap, revalidate }] =
    await Promise.all([import("./robots.ts"), import("./sitemap.ts")]);

  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.deepEqual(urls, [
    ...staticUrls,
    `${siteOrigin}/product/1214`,
    `${siteOrigin}/product/1215`,
  ]);
  assert.equal(revalidate, 3600);
  assert.equal(fetchCalls.length, 1);
  assert.equal(
    fetchCalls[0].input,
    "https://api.likenovel.net/v1/query/products/sitemap",
  );
  assert.deepEqual(fetchCalls[0].init?.next, { revalidate: 3600 });
  assert.equal(fetchCalls[0].init?.signal instanceof AbortSignal, true);

  const datedProduct = entries.find((entry) =>
    entry.url.endsWith("/product/1214"),
  );
  const undatedProduct = entries.find((entry) =>
    entry.url.endsWith("/product/1215"),
  );
  assert.equal(
    datedProduct?.lastModified instanceof Date,
    true,
    "a valid last episode date should be exposed as lastModified",
  );
  assert.equal(undatedProduct?.lastModified, undefined);

  staticUrls.forEach((url) => {
    const entry = entries.find((candidate) => candidate.url === url);
    assert.equal(
      entry?.lastModified,
      undefined,
      "static routes must not claim a deploy time as content modification time",
    );
    assert.equal(
      entry?.changeFrequency,
      url.endsWith("/websochat") ? "weekly" : "daily",
    );
  });

  assert.equal(
    urls.includes(`${siteOrigin}/main`),
    false,
    "sitemap must not include /main because it is not a real page",
  );
  assert.equal(
    urls.includes(`${siteOrigin}/product/free/free`),
    false,
    "sitemap should not include free-writing when 무료연재 means 일반연재",
  );
  assert.equal(
    urls.includes(`${siteOrigin}/product/top50/end-top`),
    false,
    "sitemap should keep TOP50 focused on free and paid serialization",
  );
  assert.equal(
    urls.includes(`${siteOrigin}/viewer/1`),
    false,
    "sitemap must not include viewer URLs",
  );

  const prodRobotsConfig = robots();
  assert.equal(
    prodRobotsConfig.sitemap,
    `${siteOrigin}/sitemap.xml`,
    "robots should point crawlers to the generated sitemap",
  );
  assert.equal(prodRobotsConfig.host, siteOrigin);

  const prodRules = Array.isArray(prodRobotsConfig.rules)
    ? prodRobotsConfig.rules[0]
    : prodRobotsConfig.rules;
  const disallow = Array.isArray(prodRules.disallow)
    ? prodRules.disallow
    : [prodRules.disallow];
  assert.equal(
    prodRules.allow,
    "/",
    "robots should allow public routes by default",
  );
  assert.ok(disallow.includes("/viewer/"), "robots should exclude viewer pages");
  assert.ok(
    disallow.includes("/product/mypage/"),
    "robots should exclude mypage pages",
  );
  assert.ok(
    disallow.includes("/product/search/result/"),
    "robots should exclude search result pages",
  );

  console.error = () => {};
  globalThis.fetch = (async () => {
    throw new Error("backend unavailable");
  }) as typeof fetch;
  assert.deepEqual(
    (await sitemap()).map((entry) => entry.url),
    staticUrls,
    "backend failure should preserve the existing static sitemap",
  );

  let devFetchCalled = false;
  process.env.NEXT_PUBLIC_WWW_SERVER_URI = "https://www.likenovel.dev";
  globalThis.fetch = (async () => {
    devFetchCalled = true;
    throw new Error("dev sitemap must not fetch products");
  }) as typeof fetch;
  assert.deepEqual(await sitemap(), []);
  assert.equal(devFetchCalled, false);

  const robotsConfig = robots();
  assert.equal(
    robotsConfig.sitemap,
    undefined,
    "non-production robots must not advertise the production sitemap",
  );
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;

  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_WWW_SERVER_URI;
  } else {
    process.env.NEXT_PUBLIC_WWW_SERVER_URI = originalSiteUrl;
  }

  if (originalApiUrl === undefined) {
    delete process.env.NEXT_PUBLIC_API_SERVER_URI;
  } else {
    process.env.NEXT_PUBLIC_API_SERVER_URI = originalApiUrl;
  }
}

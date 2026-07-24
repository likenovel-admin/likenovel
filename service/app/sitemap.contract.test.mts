import assert from "node:assert/strict";

const expectedUrls = [
  "https://www.likenovel.net/",
  "https://www.likenovel.net/product/top50/free-top",
  "https://www.likenovel.net/product/top50/paid-top",
  "https://www.likenovel.net/product/free/normal",
  "https://www.likenovel.net/product/paid",
  "https://www.likenovel.net/product/character-chat",
  "https://www.likenovel.net/websochat",
];

process.env.NEXT_PUBLIC_WWW_SERVER_URI = "https://www.likenovel.net";

const [{ default: robots }, { default: sitemap }] = await Promise.all([
  import("./robots.ts"),
  import("./sitemap.ts"),
]);

const entries = sitemap();
const urls = entries.map((entry) => entry.url);

assert.deepEqual(
  urls,
  expectedUrls,
  "sitemap should expose only the agreed main SEO entry points",
);

assert.equal(
  urls.includes("https://www.likenovel.net/main"),
  false,
  "sitemap must not include /main because it is not a real page",
);
assert.equal(
  urls.includes("https://www.likenovel.net/product/free/free"),
  false,
  "sitemap should not include free-writing when 무료연재 means 일반연재",
);
assert.equal(
  urls.includes("https://www.likenovel.net/product/top50/end-top"),
  false,
  "sitemap should keep TOP50 focused on free and paid serialization",
);
assert.equal(
  urls.includes("https://www.likenovel.net/viewer/1"),
  false,
  "sitemap should not include viewer URLs",
);

entries.forEach((entry) => {
  assert.equal(
    entry.lastModified,
    undefined,
    "sitemap should not claim deploy time as content modification time",
  );
  assert.equal(
    entry.changeFrequency,
    entry.url.endsWith("/websochat") ? "weekly" : "daily",
  );
});

const robotsConfig = robots();
assert.equal(
  robotsConfig.sitemap,
  "https://www.likenovel.net/sitemap.xml",
  "robots should point crawlers to the generated sitemap",
);
assert.equal(robotsConfig.host, "https://www.likenovel.net");

const rules = Array.isArray(robotsConfig.rules)
  ? robotsConfig.rules[0]
  : robotsConfig.rules;
const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];

assert.equal(rules.allow, "/", "robots should allow public routes by default");
assert.ok(disallow.includes("/viewer/"), "robots should exclude viewer pages");
assert.ok(disallow.includes("/product/mypage/"), "robots should exclude mypage pages");
assert.ok(
  disallow.includes("/product/search/result/"),
  "robots should exclude search result pages",
);

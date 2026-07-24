import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import nextConfig from "../next.config.mjs";
import {
  PRODUCTION_SITE_ORIGIN,
  getSiteOrigin,
  isIndexableProductionSite,
} from "../utils/siteSeo.mjs";
import {
  DEFAULT_SITE_DESCRIPTION,
  buildPageMetadata,
  buildRootMetadata,
} from "../utils/siteSeoMetadata.ts";
import robots from "./robots.ts";
import sitemap from "./sitemap.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_WWW_SERVER_URI;

const getSearchHeader = async () => {
  const headers = await nextConfig.headers();
  return headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key.toLowerCase() === "x-robots-tag");
};

try {
  process.env.NEXT_PUBLIC_WWW_SERVER_URI = `${PRODUCTION_SITE_ORIGIN}/`;

  assert.equal(getSiteOrigin(), PRODUCTION_SITE_ORIGIN);
  assert.equal(isIndexableProductionSite(), true);

  const prodRootMetadata = buildRootMetadata();
  assert.deepEqual(prodRootMetadata.title, {
    default: "라이크노벨",
    template: "%s | 라이크노벨",
  });
  assert.equal(prodRootMetadata.description, DEFAULT_SITE_DESCRIPTION);
  assert.equal(prodRootMetadata.metadataBase?.toString(), `${PRODUCTION_SITE_ORIGIN}/`);
  assert.deepEqual(prodRootMetadata.robots, {
    index: true,
    follow: true,
  });
  assert.equal(await getSearchHeader(), undefined);

  const prodSitemap = sitemap();
  assert.equal(prodSitemap.length, 6);
  assert.equal(
    prodSitemap.every((entry) => entry.url.startsWith(PRODUCTION_SITE_ORIGIN)),
    true,
  );
  assert.equal(
    prodSitemap.every((entry) => entry.lastModified === undefined),
    true,
    "sitemap should not claim a deploy timestamp as the content modification time",
  );
  assert.equal(robots().sitemap, `${PRODUCTION_SITE_ORIGIN}/sitemap.xml`);

  const categoryMetadata = buildPageMetadata({
    title: "무료 일반연재",
    description: "무료 일반연재 설명",
    path: "/product/free/normal",
  });
  assert.equal(categoryMetadata.title, "무료 일반연재");
  assert.equal(categoryMetadata.description, "무료 일반연재 설명");
  assert.equal(
    categoryMetadata.alternates?.canonical,
    `${PRODUCTION_SITE_ORIGIN}/product/free/normal`,
  );

  process.env.NEXT_PUBLIC_WWW_SERVER_URI = "https://www.likenovel.dev/";

  assert.equal(getSiteOrigin(), "https://www.likenovel.dev");
  assert.equal(isIndexableProductionSite(), false);
  assert.deepEqual(buildRootMetadata().robots, {
    index: false,
    follow: false,
  });
  assert.deepEqual(await getSearchHeader(), {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  });
  assert.deepEqual(sitemap(), []);

  const devRobots = robots();
  const devRules = Array.isArray(devRobots.rules)
    ? devRobots.rules[0]
    : devRobots.rules;
  assert.equal(devRules.allow, "/");
  assert.equal(devRules.disallow, undefined);
  assert.equal(devRobots.sitemap, undefined);
  assert.equal(devRobots.host, undefined);

  delete process.env.NEXT_PUBLIC_WWW_SERVER_URI;
  assert.equal(
    isIndexableProductionSite(),
    false,
    "missing environment configuration must fail closed",
  );
  assert.deepEqual(buildRootMetadata().robots, {
    index: false,
    follow: false,
  });

  const rootLayoutSource = readFileSync(
    new URL("./layout.tsx", import.meta.url),
    "utf8",
  );
  assert.match(rootLayoutSource, /<html lang="ko">/);
  assert.match(rootLayoutSource, /buildRootMetadata\(\)/);

  const routeLayouts = [
    {
      path: "./product/free/normal/layout.tsx",
      canonicalPath: "/product/free/normal",
    },
    {
      path: "./product/paid/layout.tsx",
      canonicalPath: "/product/paid",
    },
    {
      path: "./product/top50/free-top/layout.tsx",
      canonicalPath: "/product/top50/free-top",
    },
    {
      path: "./product/top50/paid-top/layout.tsx",
      canonicalPath: "/product/top50/paid-top",
    },
    {
      path: "./websochat/layout.tsx",
      canonicalPath: "/websochat",
    },
  ];

  routeLayouts.forEach(({ path, canonicalPath }) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /buildPageMetadata\(\{/);
    assert.ok(source.includes(`path: "${canonicalPath}"`));
  });
} finally {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_WWW_SERVER_URI;
  } else {
    process.env.NEXT_PUBLIC_WWW_SERVER_URI = originalSiteUrl;
  }
}

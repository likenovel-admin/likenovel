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
  SITE_NAME,
  buildHomeMetadata,
  buildPageMetadata,
  buildRootMetadata,
  buildWebsiteStructuredData,
} from "../utils/siteSeoMetadata.ts";
import robots from "./robots.ts";
import sitemap from "./sitemap.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_WWW_SERVER_URI;
const originalFetch = globalThis.fetch;

const getSearchHeader = async () => {
  const headers = await nextConfig.headers();
  return headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key.toLowerCase() === "x-robots-tag");
};

try {
  process.env.NEXT_PUBLIC_WWW_SERVER_URI = `${PRODUCTION_SITE_ORIGIN}/`;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;

  assert.equal(getSiteOrigin(), PRODUCTION_SITE_ORIGIN);
  assert.equal(isIndexableProductionSite(), true);

  const prodRootMetadata = buildRootMetadata();
  assert.deepEqual(prodRootMetadata.title, {
    default: "라이크노벨",
    template: "%s | 라이크노벨",
  });
  assert.equal(prodRootMetadata.description, DEFAULT_SITE_DESCRIPTION);
  assert.equal(
    DEFAULT_SITE_DESCRIPTION,
    "읽는 재미부터 주인공과의 대화까지! 당신이 찾던 웹소설, 라이크노벨.",
  );
  assert.equal(prodRootMetadata.metadataBase?.toString(), `${PRODUCTION_SITE_ORIGIN}/`);
  assert.equal(
    prodRootMetadata.alternates,
    undefined,
    "root metadata must not make every route canonical to home",
  );
  assert.equal(
    prodRootMetadata.openGraph?.url,
    undefined,
    "root metadata must not make every route's Open Graph URL home",
  );
  const prodHomeMetadata = buildHomeMetadata();
  assert.equal(
    prodHomeMetadata.alternates?.canonical,
    PRODUCTION_SITE_ORIGIN,
  );
  assert.equal(prodHomeMetadata.openGraph?.url, PRODUCTION_SITE_ORIGIN);
  assert.deepEqual(buildWebsiteStructuredData(), {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: PRODUCTION_SITE_ORIGIN,
  });
  assert.deepEqual(prodRootMetadata.robots, {
    index: true,
    follow: true,
  });
  assert.equal(await getSearchHeader(), undefined);

  const prodSitemap = await sitemap();
  assert.equal(prodSitemap.length, 7);
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
  assert.equal(
    categoryMetadata.openGraph?.url,
    `${PRODUCTION_SITE_ORIGIN}/product/free/normal`,
  );

  process.env.NEXT_PUBLIC_WWW_SERVER_URI = "https://www.likenovel.dev/";

  assert.equal(getSiteOrigin(), "https://www.likenovel.dev");
  assert.equal(isIndexableProductionSite(), false);
  assert.deepEqual(buildRootMetadata().robots, {
    index: false,
    follow: false,
  });
  assert.equal(
    buildHomeMetadata().alternates?.canonical,
    "https://www.likenovel.dev",
  );
  assert.equal(
    buildWebsiteStructuredData().url,
    "https://www.likenovel.dev",
  );
  assert.deepEqual(await getSearchHeader(), {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  });
  assert.deepEqual(await sitemap(), []);

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

  const homePageSource = readFileSync(
    new URL("./page.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(homePageSource, /^"use client"/);
  assert.match(homePageSource, /buildHomeMetadata\(\)/);
  assert.match(homePageSource, /buildWebsiteStructuredData\(\)/);
  assert.match(homePageSource, /type="application\/ld\+json"/);
  assert.match(homePageSource, /<h1 className="sr-only">\{SITE_NAME\}<\/h1>/);

  const crawlableNavPaths = [
    "/",
    "/product/top50/free-top",
    "/product/free/normal",
    "/product/paid",
    "/websochat",
  ];
  const navSources = [
    "../components/menu/GlobalNav.tsx",
    "../components/menu/MobileGlobalNav.tsx",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

  for (const navSource of navSources) {
    const compactNavSource = navSource.replace(/\s+/g, " ");
    assert.match(navSource, /import Link from "next\/link";/);
    assert.match(navSource, /const navigateFromLink = \(/);
    for (const path of crawlableNavPaths) {
      assert.ok(
        compactNavSource.includes(`<Link href="${path}"`),
        `global navigation should expose a crawlable link to ${path}`,
      );
    }
  }

  const tabSource = readFileSync(
    new URL("../components/common/Tab.tsx", import.meta.url),
    "utf8",
  );
  const top50Source = readFileSync(
    new URL("../components/top50/Top50Page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(tabSource, /import Link from "next\/link";/);
  assert.match(tabSource, /tab\.href/);
  assert.match(tabSource, /aria-current=\{activeTab === tab\.value \? "page" : undefined\}/);
  assert.match(top50Source, /href: item\.href/);
  assert.doesNotMatch(top50Source, /useRouter/);

  const routeLayouts = [
    {
      path: "./product/free/normal/layout.tsx",
      canonicalPath: "/product/free/normal",
      title: "무료 일반연재",
      description:
        "매일 새 회차가 올라오는 무료 연재 웹소설. 오늘 시작하기 좋은 작품을 만나보세요.",
    },
    {
      path: "./product/paid/layout.tsx",
      canonicalPath: "/product/paid",
      title: "유료연재",
      description:
        "몰입을 보장하는 유료연재 웹소설. 완결까지 달릴 작품을 라이크노벨에서 찾아보세요.",
    },
    {
      path: "./product/top50/free-top/layout.tsx",
      canonicalPath: "/product/top50/free-top",
      title: "무료연재 TOP50",
      description:
        "지금 독자들이 가장 많이 읽는 웹소설 TOP50. 다음에 읽을 작품을 실시간 랭킹에서 확인해보세요.",
    },
    {
      path: "./product/top50/paid-top/layout.tsx",
      canonicalPath: "/product/top50/paid-top",
      title: "유료연재 TOP50",
      description:
        "지금 독자들이 가장 많이 읽는 웹소설 TOP50. 다음에 읽을 작품을 실시간 랭킹에서 확인해보세요.",
    },
    {
      path: "./product/character-chat/layout.tsx",
      canonicalPath: "/product/character-chat",
      title: "주인공챗",
      description:
        "읽은 회차까지만 아는 웹소설 주인공과 대화하고 새로운 이야기를 이어가 보세요.",
    },
    {
      path: "./websochat/layout.tsx",
      canonicalPath: "/websochat",
      title: "웹소챗",
      description:
        "작품에 대해 묻는 웹소챗부터 주인공과 대화하는 주인공챗까지, 웹소설과 대화를 시작해보세요.",
    },
  ];

  routeLayouts.forEach(({ path, canonicalPath, title, description }) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    const compactSource = source.replace(/\s+/g, " ");
    assert.match(source, /buildPageMetadata\(\{/);
    assert.ok(source.includes(`title: "${title}"`));
    assert.ok(
      compactSource.includes(`description: "${description}"`),
      `${path} should declare the agreed search description`,
    );
    assert.ok(source.includes(`path: "${canonicalPath}"`));
  });
} finally {
  globalThis.fetch = originalFetch;
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_WWW_SERVER_URI;
  } else {
    process.env.NEXT_PUBLIC_WWW_SERVER_URI = originalSiteUrl;
  }
}

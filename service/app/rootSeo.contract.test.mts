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
  buildRootMetadata,
} from "../utils/siteSeoMetadata.ts";

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

  const prodMetadata = buildRootMetadata();
  assert.deepEqual(prodMetadata.title, {
    default: "라이크노벨",
    template: "%s | 라이크노벨",
  });
  assert.equal(prodMetadata.description, DEFAULT_SITE_DESCRIPTION);
  assert.equal(
    prodMetadata.metadataBase?.toString(),
    `${PRODUCTION_SITE_ORIGIN}/`,
  );
  assert.deepEqual(prodMetadata.robots, {
    index: true,
    follow: true,
  });
  assert.equal(await getSearchHeader(), undefined);

  process.env.NEXT_PUBLIC_WWW_SERVER_URI = "https://www.likenovel.dev/";

  assert.equal(isIndexableProductionSite(), false);
  assert.deepEqual(buildRootMetadata().robots, {
    index: false,
    follow: false,
  });
  assert.deepEqual(await getSearchHeader(), {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  });

  const rootLayoutSource = readFileSync(
    new URL("./layout.tsx", import.meta.url),
    "utf8",
  );
  assert.match(rootLayoutSource, /<html lang="ko">/);
  assert.match(rootLayoutSource, /buildRootMetadata\(\)/);
} finally {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_WWW_SERVER_URI;
  } else {
    process.env.NEXT_PUBLIC_WWW_SERVER_URI = originalSiteUrl;
  }
}

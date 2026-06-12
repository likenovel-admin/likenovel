import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const utilSource = readFileSync(
  new URL("./metadataUtils.ts", import.meta.url),
  "utf8"
);
const imageSource = readFileSync(
  new URL("./opengraph-image.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /export async function generateMetadata/);
assert.match(utilSource, /\/v1\/query\/products\/\$\{encodeURIComponent\(\s*productId\s*\)\}\/details-group/);
assert.match(source, /product\.title/);
assert.match(source, /product\.authorNickname/);
assert.match(source, /product\.synopsis/);
assert.match(utilSource, /coverImagePath\?: string \| null/);
assert.match(utilSource, /resolveProductCoverImage/);
assert.match(source, /getProductShareImageUrl\(productId, siteBaseUrl\)/);
assert.match(source, /width: 1200/);
assert.match(source, /height: 630/);
assert.match(source, /openGraph:\s*\{/);
assert.match(source, /twitter:\s*\{/);
assert.match(source, /summary_large_image/);
assert.match(source, /authors: authorNickname \? \[authorNickname\] : undefined/);

assert.match(imageSource, /import \{ ImageResponse \} from "next\/og"/);
assert.match(imageSource, /import sharp from "sharp"/);
assert.match(imageSource, /export const size = \{\s*width: 1200,\s*height: 630/s);
assert.match(imageSource, /export const contentType = "image\/png"/);
assert.match(imageSource, /sharp\(imageBuffer\)\.png\(\)\.toBuffer\(\)/);
assert.match(imageSource, /getResolvedProductCoverImageUrl\(product\.image\?\.coverImagePath, siteBaseUrl\)/);
assert.match(imageSource, /objectFit: "contain"/);
assert.doesNotMatch(imageSource, /PretendardVariable\.woff2/);
assert.doesNotMatch(imageSource, /fonts:\s*\[/);

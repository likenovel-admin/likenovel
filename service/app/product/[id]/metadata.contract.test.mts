import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

assert.match(source, /export async function generateMetadata/);
assert.match(source, /\/v1\/query\/products\/\$\{encodeURIComponent\(\s*productId\s*\)\}\/details-group/);
assert.match(source, /product\.title/);
assert.match(source, /product\.authorNickname/);
assert.match(source, /product\.synopsis/);
assert.match(source, /product\.image\?\.coverImagePath/);
assert.match(source, /resolveProductCoverImage/);
assert.match(source, /openGraph:\s*\{/);
assert.match(source, /twitter:\s*\{/);
assert.match(source, /summary_large_image/);
assert.match(source, /authors: authorNickname \? \[authorNickname\] : undefined/);

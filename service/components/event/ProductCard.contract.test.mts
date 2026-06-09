import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const source = readFileSync(resolve(__dirname, "ProductCard.tsx"), "utf8");

assert.equal(
  source.includes("data.trendindex.hitCount"),
  false,
  "Event detail product card must not expose view counts"
);

assert.equal(
  source.includes("data.trendindex.recommendCount"),
  false,
  "Event detail product card must not expose recommend counts"
);

assert.equal(
  source.includes("data.trendindex.bookmarkCount"),
  false,
  "Event detail product card must not expose bookmark counts"
);

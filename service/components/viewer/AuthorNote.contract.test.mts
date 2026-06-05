import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./AuthorNote.tsx", import.meta.url), "utf8");

assert.match(
  source,
  /작가의 한마디/,
  "AuthorNote should keep the author comment card visible",
);
assert.doesNotMatch(
  source,
  /aria-label="like"|aria-label='like'/,
  "AuthorNote should not expose a dead like button",
);
assert.doesNotMatch(
  source,
  /ThumbsUp|thumbs-up\.svg/,
  "AuthorNote should not import or render the thumbs-up SVG",
);

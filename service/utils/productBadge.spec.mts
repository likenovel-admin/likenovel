import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./productBadge.ts", import.meta.url), "utf8");

assert.match(
  source,
  /product\?\.badge\?\.newReleaseYn === "Y"/,
  "UP badge should be shown when backend marks the product as newReleaseYn",
);

assert.match(
  source,
  /getIsNewEpisode\(/,
  "UP badge should still be shown for recently updated episodes",
);

assert.match(
  source,
  /product\?\.properties\?\.latestEpisodeDate \|\| product\?\.latestEpisodeDate \|\| ""/,
  "UP badge should support both nested and top-level latestEpisodeDate shapes",
);

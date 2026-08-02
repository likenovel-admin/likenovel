import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./EpisodeRoundTab.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /const episodeDateLabel = isScheduledRelease[\s\S]*?\? "예약중"[\s\S]*?episode\.openYn === "Y"[\s\S]*?formatDate\(episode\.publishReserveDate \|\| episode\.createdDate\)[\s\S]*?\(공개일\)[\s\S]*?formatDate\(episode\.createdDate\)[\s\S]*?\(등록일\)/,
  "author episode rows should label scheduled, public, and unreserved private dates"
);

assert.match(
  source,
  /<span className="text-11pxr text-gray-500">\s*\{episodeDateLabel\}\s*<\/span>/,
  "the existing gray metadata area should render only the state-aware date label"
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dialogSource = readFileSync(
  new URL("./EpisodePreviewDialog.tsx", import.meta.url),
  "utf8"
);
const formSource = readFileSync(new URL("./FormArea.tsx", import.meta.url), "utf8");

assert.match(dialogSource, /<dialog/);
assert.match(dialogSource, /showModal\(\)/);
assert.match(dialogSource, /aria-modal="true"/);
assert.match(dialogSource, /sandbox="allow-same-origin"/);
assert.doesNotMatch(dialogSource, /allow-scripts/);
assert.match(dialogSource, /referrerPolicy="no-referrer"/);
assert.match(dialogSource, /buildEpisodePreviewDocument/);
assert.match(dialogSource, /aria-label="미리보기 닫기"/);
assert.match(dialogSource, /aria-label="미리보기 기기"/);
assert.match(dialogSource, /aria-label="모바일 미리보기"/);
assert.match(dialogSource, /aria-label="PC 미리보기"/);
assert.match(dialogSource, /aria-pressed=/);
assert.match(dialogSource, /현재는 세로보기만 지원합니다\./);
assert.match(dialogSource, /max-w-\[390px\]/);
assert.match(dialogSource, /min-w-\[1024px\]/);
assert.match(dialogSource, /h-\[44px\] w-\[44px\]/);
assert.doesNotMatch(dialogSource, /w-\[calc\(100vw-/);
assert.doesNotMatch(dialogSource, /min\(960px/);

assert.match(formSource, /getValues\("content"\)/);
assert.match(formSource, /normalizeViewerContentHtml\(getValues\("content"\)\)/);
assert.match(formSource, /hasRenderableEpisodePreviewContent/);
assert.match(formSource, /미리볼 본문을 입력해주세요\./);
assert.match(formSource, /categoryValue === "episode"/);
assert.match(formSource, />\s*미리보기\s*<\/Button>/);
assert.match(formSource, /!h-\[44px\]/);
assert.match(formSource, /maxLength=\{50\}/);
assert.match(formSource, /회차명을 입력해주세요 \(최대 50자\)/);
assert.match(formSource, /\{` \/ 50자`\}/);
assert.doesNotMatch(
  formSource,
  /handleSubmit\([^)]*preview|preview[^\n]*handleSubmit/i,
  "미리보기는 폼 validation이나 저장 mutation을 통과하면 안 된다"
);

console.log("EpisodePreviewDialog contract tests passed");

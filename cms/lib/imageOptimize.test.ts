import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateImageResizeDimensions } from "./imageOptimize";

const source = readFileSync(new URL("./imageOptimize.ts", import.meta.url), "utf8");
const coverUploadSource = source.slice(
  source.indexOf("export async function prepareCoverImageForUpload"),
);

assert.deepEqual(calculateImageResizeDimensions(4084, 5833, 1024), {
  width: 717,
  height: 1024,
});

assert.deepEqual(calculateImageResizeDimensions(2160, 3086, 1024), {
  width: 717,
  height: 1024,
});

assert.deepEqual(calculateImageResizeDimensions(480, 682, 1024), {
  width: 480,
  height: 682,
});

assert.deepEqual(calculateImageResizeDimensions(3000, 1200, 1024), {
  width: 1024,
  height: 410,
});

assert.match(source, /blob\.type !== WEBP_MIME_TYPE/);
assert.match(
  coverUploadSource,
  /throw new Error\("표지 이미지 변환에 실패했습니다\."\)/,
);
assert.doesNotMatch(coverUploadSource, /원본으로 업로드합니다/);
assert.doesNotMatch(coverUploadSource, /fileName: file\.name/);

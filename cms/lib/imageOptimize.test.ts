import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateImageResizeDimensions,
  calculateTopCropSourceRect,
} from "./imageOptimize.ts";

const source = readFileSync(new URL("./imageOptimize.ts", import.meta.url), "utf8");
const coverUploadSource = source.slice(
  source.indexOf("export async function prepareCoverImageForUpload"),
);
const bannerUploadSource = source.slice(
  source.indexOf("export async function prepareBannerImageForUpload"),
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

assert.deepEqual(calculateTopCropSourceRect(717, 1024, 364, 414), {
  x: 0,
  y: 0,
  width: 717,
  height: 815,
});

assert.deepEqual(calculateTopCropSourceRect(1200, 800, 364, 414), {
  x: 248,
  y: 0,
  width: 703,
  height: 800,
});

assert.deepEqual(calculateTopCropSourceRect(364, 414, 364, 414), {
  x: 0,
  y: 0,
  width: 364,
  height: 414,
});

assert.match(source, /blob\.type !== WEBP_MIME_TYPE/);
assert.match(source, /const BANNER_WEBP_QUALITY = 0\.95/);
assert.match(source, /const COVER_WEBP_QUALITY = 0\.92/);
assert.match(
  bannerUploadSource,
  /canvasToWebpBlob\(canvas,\s*BANNER_WEBP_QUALITY\)/,
);
assert.doesNotMatch(bannerUploadSource, /COVER_WEBP_QUALITY/);
assert.match(
  coverUploadSource,
  /throw new Error\("표지 이미지 변환에 실패했습니다\."\)/,
);
assert.match(
  coverUploadSource,
  /canvasToWebpBlob\(canvas,\s*COVER_WEBP_QUALITY\)/,
);
assert.doesNotMatch(coverUploadSource, /원본으로 업로드합니다/);
assert.doesNotMatch(coverUploadSource, /fileName: file\.name/);
assert.match(source, /export async function prepareCharacterImageFromCover/);
assert.match(source, /fetch\(coverImageUrl,\s*\{\s*credentials: "omit"\s*\}\)/);
assert.match(source, /const CHARACTER_IMAGE_WIDTH = 728/);
assert.match(source, /const CHARACTER_IMAGE_HEIGHT = 828/);
assert.match(source, /canvas\.width = CHARACTER_IMAGE_WIDTH/);
assert.match(source, /canvas\.height = CHARACTER_IMAGE_HEIGHT/);
assert.match(source, /character-\$\{productId\}\.webp/);

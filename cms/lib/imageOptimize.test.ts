import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHARACTER_IMAGE_HEIGHT,
  CHARACTER_IMAGE_WIDTH,
  calculateImageResizeDimensions,
  calculateTopCropSourceRect,
  cropCharacterImageForUpload,
  isSupportedCharacterImageFile,
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

assert.equal(CHARACTER_IMAGE_WIDTH, 728);
assert.equal(CHARACTER_IMAGE_HEIGHT, 828);
assert.equal(
  isSupportedCharacterImageFile({ type: "image/png" } as File),
  true,
);
assert.equal(
  isSupportedCharacterImageFile({ type: "image/gif" } as File),
  false,
);

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
assert.match(
  source,
  /fetch\(coverImageUrl,\s*\{[\s\S]*credentials:\s*"omit",[\s\S]*cache:\s*"no-store",[\s\S]*\}\)/,
);
assert.match(source, /const CHARACTER_IMAGE_WIDTH = 728/);
assert.match(source, /const CHARACTER_IMAGE_HEIGHT = 828/);
assert.match(source, /canvas\.width = CHARACTER_IMAGE_WIDTH/);
assert.match(source, /canvas\.height = CHARACTER_IMAGE_HEIGHT/);
assert.match(source, /character-\$\{productId\}\.webp/);
assert.match(source, /export async function cropCharacterImageForUpload/);
assert.match(source, /JPG, PNG, WebP 이미지만 사용할 수 있습니다\./);

const originalImageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Image");
const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "document",
);
const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;
const drawnArguments: unknown[][] = [];
const canvas = {
  width: 0,
  height: 0,
  getContext: () => ({
    drawImage: (...args: unknown[]) => drawnArguments.push(args),
  }),
  toBlob: (callback: (blob: Blob) => void) =>
    callback(new Blob(["cropped"], { type: "image/webp" })),
};

class MockImage {
  naturalWidth = 1200;
  naturalHeight = 800;
  width = 1200;
  height = 800;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

try {
  Object.defineProperty(globalThis, "Image", {
    configurable: true,
    value: MockImage,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => canvas },
  });
  URL.createObjectURL = () => "blob:character-test";
  URL.revokeObjectURL = () => undefined;

  const croppedFile = await cropCharacterImageForUpload(
    new File(["source"], "portrait.jpg", { type: "image/jpeg" }),
    { x: 248, y: 0, width: 703, height: 800 },
  );

  assert.equal(croppedFile.name, "portrait.webp");
  assert.equal(croppedFile.type, "image/webp");
  assert.equal(canvas.width, 728);
  assert.equal(canvas.height, 828);
  assert.deepEqual(drawnArguments[0]?.slice(1), [
    248,
    0,
    703,
    800,
    0,
    0,
    728,
    828,
  ]);
} finally {
  URL.createObjectURL = originalCreateObjectUrl;
  URL.revokeObjectURL = originalRevokeObjectUrl;
  if (originalImageDescriptor) {
    Object.defineProperty(globalThis, "Image", originalImageDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "Image");
  }
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "document");
  }
}

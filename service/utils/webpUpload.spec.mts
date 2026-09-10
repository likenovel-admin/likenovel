import assert from "node:assert/strict";

import {
  calculateImageResizeDimensions,
  prepareImageUpload,
} from "./webpUpload.ts";

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

type EncodeCall = { mimeType: string; quality: number };

interface FakeEnv {
  supportedMimeTypes: string[];
  encodeCalls: EncodeCall[];
}

const createFakeEnv = (supportedMimeTypes: string[]): FakeEnv => ({
  supportedMimeTypes,
  encodeCalls: [],
});

const createFile = (name: string, type: string, size = 32) =>
  new File([new Uint8Array(size)], name, { type });

const createDeps = (env: FakeEnv, width: number, height: number) => ({
  decodeImage: async () => ({ width, height }),
  encodeImage: async (
    _source: { width: number; height: number },
    options: {
      width: number;
      height: number;
      mimeType: string;
      quality: number;
    }
  ) => {
    env.encodeCalls.push({
      mimeType: options.mimeType,
      quality: options.quality,
    });

    if (!env.supportedMimeTypes.includes(options.mimeType)) {
      // A browser that cannot encode the requested type silently falls back to
      // PNG instead of throwing. This is the real iOS Safari behavior.
      return new Blob([new Uint8Array(16)], { type: "image/png" });
    }

    return new Blob([new Uint8Array(16)], { type: options.mimeType });
  },
});

// A browser with webp encoding keeps producing webp uploads.
{
  const env = createFakeEnv(["image/webp", "image/jpeg"]);
  const result = await prepareImageUpload(
    createFile("cover.jpg", "image/jpeg"),
    { maxDimension: 1024 },
    createDeps(env, 800, 1200)
  );

  assert.equal(result.uploadFile.type, "image/webp");
  assert.equal(result.contentType, "image/webp");
  assert.deepEqual(
    env.encodeCalls.map((call) => call.mimeType),
    ["image/webp"]
  );
}

// A browser without webp encoding must still upload, using jpeg.
{
  const env = createFakeEnv(["image/jpeg"]);
  const result = await prepareImageUpload(
    createFile("cover.jpg", "image/jpeg"),
    { maxDimension: 1024 },
    createDeps(env, 800, 1200)
  );

  assert.equal(result.uploadFile.type, "image/jpeg");
  assert.equal(result.contentType, "image/jpeg");
  assert.deepEqual(
    env.encodeCalls.map((call) => call.mimeType),
    ["image/webp", "image/jpeg"]
  );
}

// A webp source small enough to skip resizing needs no re-encoding at all.
{
  const env = createFakeEnv([]);
  const result = await prepareImageUpload(
    createFile("cover.webp", "image/webp"),
    { maxDimension: 1024 },
    createDeps(env, 683, 1024)
  );

  assert.equal(result.uploadFile.type, "image/webp");
  assert.equal(result.contentType, "image/webp");
  assert.deepEqual(env.encodeCalls, []);
}

// When no encoder works, the caller still gets a usable upload from the source.
{
  const env = createFakeEnv([]);
  const result = await prepareImageUpload(
    createFile("cover.jpg", "image/jpeg"),
    { maxDimension: 1024 },
    createDeps(env, 800, 1200)
  );

  assert.equal(result.uploadFile.type, "image/jpeg");
  assert.equal(result.contentType, "image/jpeg");
}

// contentType must always describe the bytes actually being uploaded, because
// the caller sends it as the R2 Content-Type header.
{
  const env = createFakeEnv(["image/jpeg"]);
  const result = await prepareImageUpload(
    createFile("cover.png", "image/png"),
    { maxDimension: 1024 },
    createDeps(env, 2000, 3000)
  );

  assert.equal(result.contentType, result.uploadFile.type);
  assert.equal(result.contentType, "image/jpeg");
}

// The server derives the stored object key itself and keeps the submitted name
// only as the display-only original filename, so the name is never rewritten to
// advertise a format the bytes do not have.
{
  const env = createFakeEnv(["image/jpeg"]);
  const result = await prepareImageUpload(
    createFile("표지 최종.png", "image/png"),
    { maxDimension: 1024 },
    createDeps(env, 2000, 3000)
  );

  assert.equal(result.uploadFileName, "표지 최종.png");
  assert.equal(result.uploadFile.name, "표지 최종.png");
  assert.equal(result.contentType, "image/jpeg");
}

// An unsupported source that cannot be encoded must fail loudly instead of
// uploading bytes the CDN cannot serve.
{
  const env = createFakeEnv([]);
  await assert.rejects(
    prepareImageUpload(
      createFile("cover.heic", "image/heic"),
      { maxDimension: 1024 },
      createDeps(env, 2000, 3000)
    ),
    /Failed to convert image for upload/
  );
}

console.log("webpUpload.spec.mts passed");

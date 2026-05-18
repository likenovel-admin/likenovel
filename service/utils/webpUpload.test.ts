import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateImageResizeDimensions } from "./webpUpload";

const source = readFileSync(new URL("./webpUpload.ts", import.meta.url), "utf8");

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

assert.match(source, /webpBlob\.type !== WEBP_MIME_TYPE/);

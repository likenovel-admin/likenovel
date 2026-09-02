import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./EpubViewer.tsx", import.meta.url),
  "utf8"
);

const overlayMatch = source.match(
  /\{isScroll && !epubReady && \(([\s\S]*?)\n      \)\}/
);
assert.ok(overlayMatch, "scroll-mode loading overlay block must exist");
const overlay = overlayMatch[1];

assert.match(
  overlay,
  /본문을 불러오는 중이에요/,
  "loading overlay must tell the reader the body is being loaded"
);

assert.match(
  overlay,
  /flex flex-col items-center justify-center/,
  "loading copy must sit under the spinner in a vertical centered stack"
);

assert.ok(
  overlay.indexOf("<Spinner") < overlay.indexOf("본문을 불러오는 중이에요"),
  "spinner must render above the loading copy"
);

assert.match(
  overlay,
  /style=\{\{ color: contentTextColor \}\}/,
  "loading copy must follow the viewer theme text color so dark theme stays readable"
);

assert.match(
  overlay,
  /role="status"[\s\S]*aria-live="polite"/,
  "loading overlay must be announced politely to assistive technology"
);

// 본문 노출 조건 자체는 이번 변경 대상이 아니다. 스피너 제거 시점을 좌우하는
// 안정화 타이머가 남아 있어야 저장된 읽기 위치가 흔들리지 않는다.
assert.match(
  source,
  /epubReadyTimerRef\.current = setTimeout\(\(\) => \{[\s\S]*?\}, 800\);/,
  "800ms stabilization timer must remain so restored scroll positions stay stable"
);

console.log("EpubViewer loading overlay contract OK");

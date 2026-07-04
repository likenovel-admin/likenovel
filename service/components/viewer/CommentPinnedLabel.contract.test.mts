import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const componentPaths = [
  "components/viewer/CommentList.tsx",
  "components/common/CommentArea.tsx",
];

for (const componentPath of componentPaths) {
  const source = readFileSync(resolve(componentPath), "utf8");

  assert.match(source, /작가가 고정함/);
  assert.doesNotMatch(source, /님이 고정함/);
}

console.log("Comment pinned labels use role-based copy.");

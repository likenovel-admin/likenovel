import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./MyProductAnalyticsArea.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /useProductInflowDropoffStatistics/);
assert.match(source, /source_groups/);
assert.match(
  source,
  /sourceGroupRows\.some\(\s*\(row\) => row\.detail_session_count > 0\s*\)/
);
assert.match(source, /상세페이지 유입과 회차 진입/);
assert.doesNotMatch(source, /유입 경로별 전환/);
assert.doesNotMatch(source, /SNS 세부 채널/);
assert.doesNotMatch(source, /소셜유입으로 보여줍니다/);
assert.match(source, /소셜유입/);
assert.match(source, /구좌유입/);
assert.match(source, /검색유입/);
assert.match(source, /랭킹유입/);
assert.match(source, /직접유입/);
assert.match(source, /기타/);
assert.doesNotMatch(source, /instagram|twitter|threads/);

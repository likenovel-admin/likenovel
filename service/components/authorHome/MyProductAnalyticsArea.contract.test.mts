import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./MyProductAnalyticsArea.tsx", import.meta.url),
  "utf8"
);
const recent24hSource = readFileSync(
  new URL("./Recent24hAnalyticsArea.tsx", import.meta.url),
  "utf8"
);
const recent24hShareSource = readFileSync(
  new URL("./Recent24hShareReport.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /useProductInflowDropoffStatistics/);
assert.match(source, /source_groups/);
assert.match(
  source,
  /const sourceGroupRows = useMemo/
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
assert.match(source, /화면 이해를 돕기 위한 예시 독자 여정/);
assert.match(source, /실제 수치가 아닙니다/);
assert.match(source, /SAMPLE_PRODUCT_SELECT_VALUE/);
assert.doesNotMatch(source, /selectedProductId === String\(SAMPLE_PRODUCT_ID\)/);
assert.doesNotMatch(source, /appliedFilters\.productId === String\(SAMPLE_PRODUCT_ID\)/);
assert.doesNotMatch(source, /const summaryDetailViewSessions = hasSourceGroupSummary/);
assert.match(source, /const summaryDetailViewSessions = summary\.detailViewSessions/);
assert.match(source, /funnelSummaryData/);
assert.match(source, /countPerPage: 1000/);
assert.match(source, /데이터가 없어 산출할 수 없습니다/);
assert.match(recent24hSource, /화면 이해를 돕기 위한 예시 데이터/);
assert.match(recent24hSource, /실제 작품의 최근 24시간 수치가 아닙니다/);
assert.match(recent24hSource, /if \(!productId && !isSample\)/);
assert.match(recent24hShareSource, /최근 24시간 · 예시 데이터/);
assert.match(recent24hShareSource, /실제 수치가 아닙니다/);

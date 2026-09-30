import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EMPTY_NOTICE_TOP_BAR,
  buildNoticeTopBarRequest,
  describeNoticeTopBarPeriod,
  noticeTopBarFromDetail,
  resolveNoticeTopBarStatus,
  validateNoticeTopBar,
} from "./noticeTopBar.ts";

assert.deepEqual(buildNoticeTopBarRequest(EMPTY_NOTICE_TOP_BAR), { top_bar_yn: "N" });
assert.deepEqual(
  buildNoticeTopBarRequest({
    enabled: true,
    text: "  웹소챗 장애 보상 안내 ",
    startAt: "2026-09-30T18:00",
    endAt: "",
  }),
  {
    top_bar_yn: "Y",
    top_bar_text: "웹소챗 장애 보상 안내",
    top_bar_start_date: "2026-09-30 18:00",
    top_bar_end_date: null,
  }
);
assert.deepEqual(
  noticeTopBarFromDetail({
    top_bar_yn: "Y",
    top_bar_text: "안내",
    top_bar_start_date: "2026-09-30T18:00:00",
    top_bar_end_date: null,
  }),
  { enabled: true, text: "안내", startAt: "2026-09-30T18:00", endAt: "" }
);
assert.equal(validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true }), "상단 띠 문구를 입력해주세요.");
assert.equal(
  validateNoticeTopBar({ enabled: true, text: "안내", startAt: "2026-10-01T10:00", endAt: "2026-10-01T10:00" }),
  "상단 띠 종료 시각은 시작 시각보다 뒤여야 합니다."
);
assert.equal(validateNoticeTopBar({ enabled: false, text: "", startAt: "", endAt: "" }), null);
assert.equal(describeNoticeTopBarPeriod({}), "즉시 ~ 계속");
assert.equal(
  describeNoticeTopBarPeriod({ top_bar_start_date: "2026-09-30T18:00:00", top_bar_end_date: null }),
  "09-30 18:00 ~ 계속"
);

// 목록 상태: 공개 API가 내려주는 띠만 "노출 중", 나머지는 기간으로 판정한다.
const NOW = Date.parse("2026-10-01T12:00:00+09:00");
const bar = {
  id: 90,
  top_bar_yn: "Y",
  top_bar_start_date: "2026-09-30T20:05:00",
  top_bar_end_date: "2026-10-07 23:59:00",
};
assert.equal(resolveNoticeTopBarStatus(bar, 90, NOW), "노출 중");
assert.equal(resolveNoticeTopBarStatus(bar, 91, NOW), "대기", "a newer bar hides this one");
assert.equal(resolveNoticeTopBarStatus(bar, null, NOW), null, "no live bar: do not guess why");
assert.equal(resolveNoticeTopBarStatus(bar, undefined, NOW), null, "unknown live bar: show the period only");
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, top_bar_end_date: "2026-10-01 12:00:00" }, undefined, NOW),
  "종료",
  "the public API stops at the end time"
);
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, top_bar_start_date: "2026-10-01T12:01:00" }, undefined, NOW),
  "예약"
);
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, top_bar_start_date: "2026-10-01T12:00:00" }, 91, NOW),
  "대기",
  "a bar starting now is already in its window"
);
assert.equal(resolveNoticeTopBarStatus({ ...bar, top_bar_yn: "N" }, 90, NOW), null);

for (const page of ["./add/page.tsx", "./[noticeId]/page.tsx"]) {
  const source = readFileSync(new URL(page, import.meta.url), "utf8");
  assert.match(source, /<NoticeTopBarFields/, `${page} should let operators set the top bar`);
  assert.match(source, /validateNoticeTopBar\(topBar\)/, `${page} should validate before saving`);
  assert.match(source, /\.\.\.buildNoticeTopBarRequest\(topBar\)/, `${page} should send the top bar with the notice`);
}
const editSource = readFileSync(new URL("./[noticeId]/page.tsx", import.meta.url), "utf8");
assert.match(editSource, /noticeTopBarFromDetail\(data\.data\)/, "edit page should load the saved top bar");
const fieldsSource = readFileSync(new URL("./NoticeTopBarFields.tsx", import.meta.url), "utf8");
assert.match(fieldsSource, /<label htmlFor="top-bar-text"/, "the bar text input needs a visible label");
const tableSource = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
assert.match(tableSource, /useGetLiveNoticeTopBar\(\)/, "the list should read the bar the site shows now");
assert.match(tableSource, /resolveNoticeTopBarStatus\(/, "the list should label each bar's status");
console.log("noticeTopBar tests passed");

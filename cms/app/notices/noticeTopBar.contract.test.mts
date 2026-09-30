import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EMPTY_NOTICE_TOP_BAR,
  buildNoticeTopBarRequest,
  describeNoticeTopBarPeriod,
  noticeTopBarFromDetail,
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
assert.equal(describeNoticeTopBarPeriod({}), "노출");
assert.equal(
  describeNoticeTopBarPeriod({ top_bar_start_date: "2026-09-30T18:00:00", top_bar_end_date: null }),
  "09-30 18:00 ~ 계속"
);

for (const page of ["./add/page.tsx", "./[noticeId]/page.tsx"]) {
  const source = readFileSync(new URL(page, import.meta.url), "utf8");
  assert.match(source, /<NoticeTopBarFields/, `${page} should let operators set the top bar`);
  assert.match(source, /validateNoticeTopBar\(topBar\)/, `${page} should validate before saving`);
  assert.match(source, /\.\.\.buildNoticeTopBarRequest\(topBar\)/, `${page} should send the top bar with the notice`);
}
const editSource = readFileSync(new URL("./[noticeId]/page.tsx", import.meta.url), "utf8");
assert.match(editSource, /noticeTopBarFromDetail\(data\.data\)/, "edit page should load the saved top bar");
console.log("noticeTopBar tests passed");

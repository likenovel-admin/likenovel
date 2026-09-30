import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EMPTY_NOTICE_TOP_BAR,
  buildNoticeTopBarRequest,
  describeNoticeTopBarPeriod,
  noticeTopBarFromDetail,
  resolveNoticeTopBarStatus,
  validateNoticeTopBar,
  validateNoticeTopBarLink,
} from "./noticeTopBar.ts";

assert.deepEqual(buildNoticeTopBarRequest(EMPTY_NOTICE_TOP_BAR), { top_bar_yn: "N" });
assert.deepEqual(
  buildNoticeTopBarRequest({
    enabled: true,
    text: "  웹소챗 장애 보상 안내 ",
    startAt: "2026-09-30T18:00",
    endAt: "",
    linkUrl: "  ",
  }),
  {
    top_bar_yn: "Y",
    top_bar_text: "웹소챗 장애 보상 안내",
    top_bar_start_date: "2026-09-30 18:00",
    top_bar_end_date: null,
    top_bar_link_url: null,
  }
);
assert.equal(
  buildNoticeTopBarRequest({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", linkUrl: " /event/12 " })
    .top_bar_link_url,
  "/event/12"
);
assert.deepEqual(
  noticeTopBarFromDetail({
    top_bar_yn: "Y",
    top_bar_text: "안내",
    top_bar_start_date: "2026-09-30T18:00:00",
    top_bar_end_date: null,
    top_bar_link_url: "https://www.likenovel.net/event/12",
  }),
  {
    enabled: true,
    text: "안내",
    startAt: "2026-09-30T18:00:00",
    endAt: "",
    linkUrl: "https://www.likenovel.net/event/12",
  }
);
// 수정 화면을 열고 그대로 저장해도 초까지 유지돼야 겹치는 띠의 노출 순서가 바뀌지 않는다.
assert.deepEqual(
  buildNoticeTopBarRequest(
    noticeTopBarFromDetail({
      top_bar_yn: "Y",
      top_bar_text: "안내",
      top_bar_start_date: "2026-09-30T18:30:50",
      top_bar_end_date: "2026-10-07 23:59:00",
    })
  ),
  {
    top_bar_yn: "Y",
    top_bar_text: "안내",
    top_bar_start_date: "2026-09-30 18:30:50",
    top_bar_end_date: "2026-10-07 23:59:00",
    top_bar_link_url: null,
  }
);

// 링크 규칙은 백엔드와 같다: 비우면 공지로, /로 시작하는 사이트 주소나 https:// 주소만.
// 백엔드 tests/test_notice_top_bar.py와 같은 사례다.
for (const ok of ["", "  ", "/event/12", "/product/1231?tab=episode", "/search?keyword=회귀&next=https://x.example//y", "https://www.likenovel.net/event/12", "HTTPS://example.com/path", "https://www.likenovel.net/x#y"]) {
  assert.equal(validateNoticeTopBarLink(ok), null, ok);
}
for (const bad of [
  "javascript:alert(1)",
  "http://example.com",
  "//evil.example",
  "/\\evil.example",
  "event/12",
  "https://",
  "https:evil",
  "https:/x",
  "https://[",
  "https://[bad]",
  "https://@",
  "https://:443",
  "https://example.com:bad",
  "https://www.likenovel.net:443/x",
  "https://%09.example",
  "https://www.likenovel.net@evil.example",
  "https://\u017fite.example",
  "https://b.1",
  "https://127.0.0.1/x",
  "https://xn--",
  "https://xn--a.example",
  "https://www.likenovel.net/a b",
  "/%2e%2e//evil.example",
  "/a//b",
  "/../x",
  "/a/./b",
  "/a\tb",
  "/a\u0085b",
  "/a\ufeffb",
  "/a\u200bb",
  "/" + "a".repeat(500),
]) {
  assert.notEqual(validateNoticeTopBarLink(bad), null, bad);
}
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", linkUrl: "javascript:alert(1)" }),
  "상단 띠 링크는 /로 시작하는 사이트 주소나 https:// 주소만 넣을 수 있습니다."
);
// 길이는 utf8mb4 VARCHAR(500)처럼 글자 수로 센다(이모지 1개 = 1자).
assert.equal(validateNoticeTopBarLink("/search?q=" + "\u{1F600}".repeat(246)), null);
assert.notEqual(validateNoticeTopBarLink("/" + "\u{1F600}".repeat(500)), null);
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", linkUrl: "https://xn--a.example" }),
  "상단 띠 링크는 /로 시작하는 사이트 주소나 https:// 주소만 넣을 수 있습니다."
);
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: false, linkUrl: "javascript:alert(1)" }),
  null,
  "a turned-off bar ignores the link field"
);
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", startAt: "2026-10-01T10:00:30", endAt: "2026-10-01T10:00" }),
  "상단 띠 종료 시각은 시작 시각보다 뒤여야 합니다.",
  "compare minute and second precision values in time order"
);
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", startAt: "2026-10-01T10:00", endAt: "2026-10-01T10:00:00" }),
  "상단 띠 종료 시각은 시작 시각보다 뒤여야 합니다.",
  "the same time written with and without seconds is not later"
);
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", startAt: "2026-10-01T10:00", endAt: "2026-10-01T10:00:01" }),
  null
);
assert.equal(validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true }), "상단 띠 문구를 입력해주세요.");
assert.equal(
  validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: true, text: "안내", startAt: "2026-10-01T10:00", endAt: "2026-10-01T10:00" }),
  "상단 띠 종료 시각은 시작 시각보다 뒤여야 합니다."
);
assert.equal(validateNoticeTopBar({ ...EMPTY_NOTICE_TOP_BAR, enabled: false, text: "", startAt: "", endAt: "" }), null);
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
  top_bar_text: "안내",
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
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, use_yn: "N" }, 91, NOW),
  null,
  "the public API never shows a hidden notice, so do not call it waiting"
);
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, top_bar_text: null }, 91, NOW),
  null,
  "the public API skips a bar without text"
);
assert.equal(
  resolveNoticeTopBarStatus({ ...bar, top_bar_end_date: "2026-10-01 11:59:00" }, 90, NOW),
  "종료",
  "a live id read before the end time must not keep an ended bar live"
);

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
assert.match(fieldsSource, /<label htmlFor="top-bar-link"/, "the link input needs a visible label");
assert.equal(
  (fieldsSource.match(/type="datetime-local"[\s\S]*?step=\{1\}/g) ?? []).length,
  2,
  "period inputs must keep seconds so re-saving keeps the saved start"
);
const tableSource = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
assert.match(tableSource, /useGetLiveNoticeTopBar\(\)/, "the list should read the bar the site shows now");
assert.match(tableSource, /resolveNoticeTopBarStatus\(/, "the list should label each bar's status");
assert.match(tableSource, /liveTopBar\.refetch\(\)/, "deleting a notice must re-read the live bar");
const apiSource = readFileSync(new URL("../../api/notice/index.ts", import.meta.url), "utf8");
assert.match(
  apiSource,
  /useGetLiveNoticeTopBar[\s\S]*?throwOnError: false/,
  "a failed live-bar read must fall back to the period instead of breaking the list"
);
console.log("noticeTopBar tests passed");

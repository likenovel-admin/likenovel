import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  TOP_NOTICE_BAR_DISMISS_LIMIT,
  addDismissedTopNoticeBarToken,
  buildTopNoticeBarDismissToken,
  buildTopNoticeBarHref,
  isTopNoticeBarHiddenOnPath,
  parseCachedTopNoticeBar,
  parseDismissedTopNoticeBarTokens,
} from "./topNoticeBar.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("띠는 공지 상세로 이동하고 문구가 바뀌면 다시 보인다", () => {
  assert.equal(buildTopNoticeBarHref(89), "/product/customer-service/notice/89");
  assert.notEqual(
    buildTopNoticeBarDismissToken({ noticeId: 89, text: "장애 안내" }),
    buildTopNoticeBarDismissToken({ noticeId: 89, text: "장애 해결 안내" })
  );
});

test("여러 띠를 닫아도 각각 기억한다 (A 닫기 -> B 닫기 -> A 다시 선택)", () => {
  const a = buildTopNoticeBarDismissToken({ noticeId: 1, text: "A" });
  const b = buildTopNoticeBarDismissToken({ noticeId: 2, text: "B" });
  const tokens = addDismissedTopNoticeBarToken(addDismissedTopNoticeBarToken([], a), b);
  assert.ok(tokens.includes(a) && tokens.includes(b));
  const many = Array.from({ length: 30 }, (_, i) => `t${i}`).reduce(addDismissedTopNoticeBarToken, [] as string[]);
  assert.equal(many.length, TOP_NOTICE_BAR_DISMISS_LIMIT);
  assert.equal(many[0], "t29");
});

test("손상된 저장값은 무시한다", () => {
  assert.deepEqual(parseDismissedTopNoticeBarTokens("{broken"), []);
  assert.deepEqual(parseDismissedTopNoticeBarTokens(JSON.stringify(["1:A", 3])), ["1:A"]);
  assert.equal(parseCachedTopNoticeBar("not json"), null);
  assert.equal(parseCachedTopNoticeBar(JSON.stringify({ noticeId: "1", text: "A" })), null);
  assert.deepEqual(parseCachedTopNoticeBar(JSON.stringify({ noticeId: 8, text: "안내" })), { noticeId: 8, text: "안내" });
});

test("웹소챗 화면에서는 띠를 숨긴다", () => {
  assert.equal(isTopNoticeBarHiddenOnPath("/websochat"), true);
  assert.equal(isTopNoticeBarHiddenOnPath("/websochat?product_id=1"), true);
  assert.equal(isTopNoticeBarHiddenOnPath("/"), false);
  assert.equal(isTopNoticeBarHiddenOnPath(null), false);
});

test("띠 조회 실패는 페이지를 멈추지 않고, 예약 변경을 주기적으로 반영한다", () => {
  const query = read("../app/api/query/notice/index.ts");
  assert.match(query, /useGetNoticeTopBar[\s\S]*throwOnError: false/);
  assert.match(query, /useGetNoticeTopBar[\s\S]*refetchInterval: TOP_NOTICE_BAR_REFRESH_MS/);
  const bar = read("../components/menu/TopNoticeBar.tsx");
  assert.match(bar, /useLayoutEffect\(/, "offset must be applied before paint");
  assert.match(bar, /isError \? null/, "a failed request hides the bar");
});

test("띠가 보이면 고정 헤더, 검색창, 본문 여백이 같이 내려간다", () => {
  const globalNav = read("../components/menu/GlobalNav.tsx");
  const mobileNav = read("../components/menu/MobileGlobalNav.tsx");
  assert.match(globalNav, /<TopNoticeBar \/>/);
  assert.match(globalNav, /top: "var\(--top-notice-bar-h, 0px\)"/);
  assert.match(mobileNav, /top: "var\(--top-notice-bar-h, 0px\)"/);
  assert.match(read("../components/search/SearchModal.tsx"), /md:mt-\[calc\(60px_\+_var\(--top-notice-bar-h,0px\)\)\]/);
  assert.doesNotMatch(read("../components/search/SearchModal.tsx"), /"md:mt-\[60px\]"/);
  for (const path of ["../app/HomePageClient.tsx", "../app/product/layout.tsx"]) {
    const source = read(path);
    assert.match(source, /pt-\[calc\(130px_\+_var\(--top-notice-bar-h,0px\)\)\]/, path);
    assert.match(source, /md:pt-\[calc\(115px_\+_var\(--top-notice-bar-h,0px\)\)\]/, path);
  }
});

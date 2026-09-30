import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildTopNoticeBarDismissToken,
  buildTopNoticeBarHref,
  isTopNoticeBarHiddenOnPath,
} from "./topNoticeBar.ts";

test("띠는 공지 상세로 이동하고 문구가 바뀌면 다시 보인다", () => {
  assert.equal(buildTopNoticeBarHref(89), "/product/customer-service/notice/89");
  assert.notEqual(
    buildTopNoticeBarDismissToken({ noticeId: 89, text: "장애 안내" }),
    buildTopNoticeBarDismissToken({ noticeId: 89, text: "장애 해결 안내" })
  );
});

test("웹소챗 화면에서는 띠를 숨긴다", () => {
  assert.equal(isTopNoticeBarHiddenOnPath("/websochat"), true);
  assert.equal(isTopNoticeBarHiddenOnPath("/websochat?product_id=1"), true);
  assert.equal(isTopNoticeBarHiddenOnPath("/"), false);
  assert.equal(isTopNoticeBarHiddenOnPath(null), false);
});

test("띠가 보이면 고정 헤더와 본문 여백이 같이 내려간다", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const globalNav = read("../components/menu/GlobalNav.tsx");
  const mobileNav = read("../components/menu/MobileGlobalNav.tsx");
  assert.match(globalNav, /<TopNoticeBar \/>/);
  assert.match(globalNav, /top: "var\(--top-notice-bar-h, 0px\)"/);
  assert.match(mobileNav, /top: "var\(--top-notice-bar-h, 0px\)"/);
  for (const path of ["../app/HomePageClient.tsx", "../app/product/layout.tsx"]) {
    const source = read(path);
    assert.match(source, /pt-\[calc\(130px_\+_var\(--top-notice-bar-h,0px\)\)\]/, path);
    assert.match(source, /md:pt-\[calc\(115px_\+_var\(--top-notice-bar-h,0px\)\)\]/, path);
  }
});

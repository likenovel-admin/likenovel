import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(
  new URL("./CustomerServiceLayout.tsx", import.meta.url),
  "utf8"
);
const formSource = readFileSync(new URL("./InquiryForm.tsx", import.meta.url), "utf8");
const noticeSource = readFileSync(
  new URL("../episodeManager/NoticeTab.tsx", import.meta.url),
  "utf8"
);
const footerSource = readFileSync(
  new URL("../menu/Footer.tsx", import.meta.url),
  "utf8"
);
const mobileFooterSource = readFileSync(
  new URL("../menu/MobileFooter.tsx", import.meta.url),
  "utf8"
);

test("1:1 문의 탭은 내부 문의 화면으로 이동한다", () => {
  assert.match(layoutSource, /router\.push\(`\/product\/customer-service\/\$\{value\}`\)/);
  assert.doesNotMatch(layoutSource, /window\.location\.href|ADMIN_EMAIL/);
});

test("푸터의 1:1 고객상담은 내부 문의 화면으로 이동한다", () => {
  assert.match(footerSource, /href="\/product\/customer-service\/inquiry"/);
  assert.match(mobileFooterSource, /href="\/product\/customer-service\/inquiry"/);
  assert.doesNotMatch(footerSource, /ADMIN_EMAIL/);
  assert.doesNotMatch(mobileFooterSource, /ADMIN_EMAIL/);
});

test("1:1 문의 폼은 API 접수와 필수 동의를 연결한다", () => {
  assert.match(formSource, /createSupportQna\(/);
  assert.match(formSource, /rules=\{\{ required: "개인정보 수집 및 이용에 동의해주세요\." \}\}/);
  assert.doesNotMatch(formSource, /console\.log\("submit"/);
  assert.doesNotMatch(formSource, /InquiryAddFileArea/);
});

test("작품 공지 목록에는 명시적인 수정 버튼이 있다", () => {
  assert.match(noticeSource, /aria-label=\{`공지 수정: \$\{notice\.subject\}`\}/);
  assert.match(noticeSource, />\s*수정\s*<\/button>/);
});

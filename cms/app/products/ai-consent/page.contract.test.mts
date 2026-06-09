import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const table = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
const api = readFileSync(
  new URL("../../../api/productAiConsent/index.ts", import.meta.url),
  "utf8"
);
const dto = readFileSync(
  new URL("../../../api/productAiConsent/dto.ts", import.meta.url),
  "utf8"
);
const sidebar = readFileSync(
  new URL("../../../components/app-sidebar.tsx", import.meta.url),
  "utf8"
);

assert.match(sidebar, /AI 활용 동의 현황/);
assert.match(sidebar, /\/products\/ai-consent/);

assert.match(api, /\/v1\/query\/admins\/product-ai-consents/);
assert.match(api, /\/v1\/query\/admins\/product-ai-consents\/all/);
assert.match(api, /GetProductAiConsents/);
assert.match(api, /getProductAiConsentsDownload/);

assert.match(dto, /product_id: number/);
assert.match(dto, /title: string/);
assert.match(dto, /nickname: string \| null/);
assert.match(dto, /author_email: string \| null/);
assert.match(dto, /episode_count: number/);
assert.match(dto, /open_yn: "Y" \| "N"/);
assert.match(dto, /ai_promotion_yn: "Y" \| "N"/);
assert.match(dto, /websochat_enabled_yn: "Y" \| "N"/);

for (const header of [
  "작품 ID",
  "작품명",
  "작가명",
  "이메일",
  "회차수",
  "작품 공개여부",
  "AI홍보",
  "웹소챗",
]) {
  assert.match(table, new RegExp(`header: "${header}"`));
}

assert.match(table, /key: "ai_promotion_yn"/);
assert.match(table, /key: "websochat_enabled_yn"/);
assert.doesNotMatch(table, /선택A|선택B/);
assert.match(table, /value === "Y" \? "Y" : "N"/);

assert.match(page, /PageHeader title="AI 활용 동의 현황"/);
assert.match(page, /downloadExcel<IProductAiConsentItem>/);
assert.match(page, /getProductAiConsentsDownload/);
assert.match(page, /엑셀 다운로드/);
assert.match(page, /SelectItem value="product-id">작품 ID/);
assert.match(page, /SelectItem value="product-title">작품명/);
assert.match(page, /SelectItem value="nickname">작가명/);

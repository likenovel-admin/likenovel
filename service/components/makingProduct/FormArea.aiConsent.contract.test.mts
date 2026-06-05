import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./FormArea.tsx", import.meta.url), "utf8");
const dto = readFileSync(
  new URL("../../app/api/query/author/product/dto.ts", import.meta.url),
  "utf8"
);
const terms = readFileSync(
  new URL("../common/TermsOfUseContent.tsx", import.meta.url),
  "utf8"
);

assert.match(source, /aiExternalPromotionYn: "Y" \| "N"/);
assert.match(source, /productId \? originData\.aiExternalPromotionYn : "Y"/);
assert.match(source, /aiExternalPromotionYn:\s*data\?\.data\.aiExternalPromotionYn === "N"\s*\? "N"\s*: "Y"/);
assert.match(source, /ai_external_promotion_yn: formData\.aiExternalPromotionYn/);
assert.match(source, /작품홍보·광고 목적 AI생성 콘텐츠 제작 및 게재 동의\(서비스 내 메인 배너, 공식 소셜콘텐츠\)/);
assert.match(source, /선택하지 않아도 작품 등록은 가능합니다\./);
assert.match(source, /\(\*미선택 시 서비스 내외 작품 홍보가 일부 제한됩니다\)/);
assert.match(source, /마이페이지 > 작품 관리 > AI 설정/);
assert.match(source, /agree: true/);
assert.match(source, /if \(!productId && !data\.agree\)/);
assert.match(source, /name="agree"[\s\S]*rules=\{[\s\S]*productId[\s\S]*\? undefined[\s\S]*required: "이용약관에 동의해주세요\."/);
assert.match(source, /checked=\{productId \? true : field\.value\}/);
assert.match(source, /disabled=\{!!productId\}/);
assert.doesNotMatch(source, /aiContentServiceEnabledYn/);
assert.doesNotMatch(source, /ai_content_service_enabled_yn: formData/);
assert.doesNotMatch(source, /플랫폼 내 AI 콘텐츠 서비스 활성화/);
assert.doesNotMatch(source, /미선택시 독자 노출/);
assert.doesNotMatch(source, /name="aiExternalPromotionYn"[\s\S]{0,200}rules=/);

assert.match(dto, /ai_content_service_enabled_yn\?: "Y" \| "N"/);
assert.match(dto, /ai_external_promotion_yn\?: "Y" \| "N"/);
assert.match(dto, /aiContentServiceEnabledYn\?: "Y" \| "N"/);
assert.match(dto, /aiExternalPromotionYn\?: "Y" \| "N"/);

assert.match(terms, /홍보·광고 목적 AI 생성 콘텐츠의 제작 및 게재/);
assert.match(terms, /외부 채널 게재 동의는 제④항의 작품별 개별 동의와 별도로 구분/);
assert.match(terms, /미응답 작품은 홍보·광고 목적 AI 생성 콘텐츠 외부 채널 게재에 동의하지 않은 것으로 처리/);

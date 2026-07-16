import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(
  new URL("../../../api/mainCharacterSlot/index.ts", import.meta.url),
  "utf8"
);

assert.match(
  apiSource,
  /\/v1\/query\/admins\/main-character-slots\/products\/\$\{productId\}\/characters/,
  "CMS should load the selected product's strict slot roster"
);
assert.match(
  apiSource,
  /url:\s*"\/v1\/query\/admins\/main-character-slots\/products"/,
  "CMS should use the paginated slot-eligible product endpoint"
);
assert.match(
  apiSource,
  /queryParams:\s*params/,
  "CMS should send product search and pagination parameters"
);
assert.match(
  pageSource,
  /id="character-product-search"/,
  "CMS should retain server-side product search"
);
assert.match(
  pageSource,
  /setProductPage\(\(current\) => Math\.max\(1, current - 1\)\)/,
  "CMS should support the previous product page"
);
assert.match(
  pageSource,
  /setProductPage\(\(current\) => Math\.min\(productTotalPages, current \+ 1\)\)/,
  "CMS should support the next product page"
);
assert.match(
  pageSource,
  /aria-pressed=\{selectedProduct\?\.productId === product\.productId\}/,
  "CMS should expose products as a directly selectable list"
);
for (const label of ["양호", "보통", "부족"]) {
  assert.match(
    pageSource,
    new RegExp(label),
    `CMS should render the ${label} chat quality label`
  );
}
assert.match(
  pageSource,
  /product\.chatQuality/,
  "CMS should render quality from the product API instead of a local guess"
);
assert.match(
  pageSource,
  /onValueChange=\{setCharacterScopeKey\}/,
  "CMS should populate a character dropdown after product selection"
);
assert.match(
  pageSource,
  /disabled=\{!selectedProduct \|\| isLoadingRoster \|\| roster\.length === 0\}/,
  "CMS should disable the character dropdown until a selectable roster is ready"
);
assert.match(
  pageSource,
  /\{selectedCharacter\?\.displayName\}/,
  "CMS should show only the canonical display name in the selected value"
);
assert.match(
  pageSource,
  /item\.aliases\.filter\(\s*\(alias\) => alias !== item\.displayName\s*\)/,
  "CMS should remove the canonical display name from alias helper text"
);
assert.match(
  apiSource,
  /\/v1\/command\/admins\/main-character-slots\/publish-now/,
  "CMS should support immediate publication without replacing another card"
);
assert.match(
  pageSource,
  /group_type:\s*"character"/,
  "Character portraits should use the character upload group"
);
assert.match(
  pageSource,
  /prepareCharacterImageFromCover/,
  "CMS should generate a character image from the selected cover when no portrait is uploaded"
);
assert.match(
  pageSource,
  /getCdnUrl\(product\.coverImagePath\)/,
  "CMS should use the selected product cover for automatic character image generation"
);
assert.doesNotMatch(
  pageSource,
  /캐릭터 이미지를 선택해 주세요\./,
  "Character image upload must remain optional"
);
assert.match(
  pageSource,
  /미등록 시 작품 표지를 상단 기준으로 자동 크롭합니다\./,
  "CMS should explain the automatic cover crop behavior"
);
assert.match(
  pageSource,
  /character_scope_key:\s*characterScopeKey/,
  "The selected canonical character scope should be sent to the backend"
);
assert.doesNotMatch(
  pageSource,
  /character_name\s*:/,
  "CMS must not override the roster display name"
);

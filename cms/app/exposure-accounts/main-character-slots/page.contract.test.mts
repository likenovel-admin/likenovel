import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(
  new URL("../../../api/mainCharacterSlot/index.ts", import.meta.url),
  "utf8"
);
const cropDialogSource = readFileSync(
  new URL("./CharacterImageCropDialog.tsx", import.meta.url),
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
  /url:\s*"\/v1\/query\/admins\/main-character-slots\/config"/,
  "CMS should load the persisted automatic/manual display mode"
);
assert.match(
  apiSource,
  /url:\s*"\/v1\/command\/admins\/main-character-slots\/config"/,
  "CMS should persist display-mode changes through the admin command API"
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
for (const tab of ["메인 12명 편성", "전체 공개", "후보 검수"]) {
  assert.match(pageSource, new RegExp(tab), `CMS should expose the ${tab} area`);
}
for (const modeLabel of ["자동 모드", "수동 선택 모드"]) {
  assert.match(
    pageSource,
    new RegExp(modeLabel),
    `CMS should expose the ${modeLabel} option`
  );
}
assert.match(
  pageSource,
  /isError: isConfigError/,
  "CMS should distinguish a failed config read from automatic mode"
);
assert.doesNotMatch(
  pageSource,
  /configData\?\.data\.displayMode \?\? "auto"/,
  "CMS should not silently present an unreadable config as automatic mode"
);
assert.match(
  pageSource,
  /if \(isConfigError \|\| !displayMode\) \{[\s\S]*role="alert"[\s\S]*홈 구좌 설정을 불러오지 못했습니다\.[\s\S]*onClick=\{\(\) => void refetchConfig\(\)\}/,
  "CMS should show a retryable config error instead of rendering an assumed mode"
);
assert.match(
  pageSource,
  /추천순 상위 후보군[\s\S]*무작위로 12명/,
  "CMS should explain the automatic home-slot behavior"
);
assert.match(
  pageSource,
  /기본 이미지가 아닌 실제 이미지[\s\S]*자산 준비[\s\S]*주인공/,
  "CMS should expose the automatic recommendation priority to operators"
);
assert.match(
  pageSource,
  /selectedCharacter\?\.chatQuality === "insufficient"/,
  "CMS should block publishing an insufficient character"
);
assert.match(
  pageSource,
  /distinctEpisodeCount[\s\S]*exampleCount[\s\S]*sceneCount/,
  "CMS should show per-character quality evidence to operators"
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
  /characterImage\?\.name \|\|[\s\S]*currentCharacterImageUrl \|\|[\s\S]*fallbackCharacterImageUrl/,
  "CMS should show the current image URL beside the picker"
);
assert.match(
  pageSource,
  /alt="캐릭터 이미지 미리보기"/,
  "CMS should preview the selected or current character image"
);
assert.match(
  pageSource,
  /aria-label="캐릭터 이미지 크롭"/,
  "CMS should expose the crop action on the image preview"
);
assert.match(
  pageSource,
  /fetch\(characterImagePreview,\s*\{[\s\S]*credentials:\s*"omit",[\s\S]*cache:\s*"no-store",[\s\S]*\}\)/,
  "The crop fetch should bypass the no-CORS browser image cache"
);
assert.match(
  pageSource,
  /권장 \{CHARACTER_IMAGE_WIDTH\} × \{CHARACTER_IMAGE_HEIGHT\}px 이상/,
  "CMS should show the recommended character image resolution"
);
assert.match(
  cropDialogSource,
  /calculateTopCropSourceRect[\s\S]*cropCharacterImageForUpload/,
  "The crop modal should initialize and export a real fixed-ratio crop"
);
assert.match(
  cropDialogSource,
  /onPointerDown[\s\S]*onPointerMove[\s\S]*type="range"/,
  "The crop rectangle should support positioning and zoom"
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

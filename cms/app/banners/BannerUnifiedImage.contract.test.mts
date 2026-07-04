import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const addSource = readFileSync(new URL("./add/page.tsx", import.meta.url), "utf8");
const editSource = readFileSync(
  new URL("./[bannerId]/page.tsx", import.meta.url),
  "utf8",
);
const tableSource = readFileSync(new URL("./DataTable.tsx", import.meta.url), "utf8");
const sortableTableSource = readFileSync(
  new URL("./SortableBannersTable.tsx", import.meta.url),
  "utf8",
);
const bannerConstantsSource = readFileSync(
  new URL("../../constants/banner.ts", import.meta.url),
  "utf8",
);
const bannerEnumSource = readFileSync(
  new URL("../../enums/banner.ts", import.meta.url),
  "utf8",
);
const bannerImagePolicySource = readFileSync(
  new URL("../../lib/bannerImagePolicy.ts", import.meta.url),
  "utf8",
);

assert.match(
  bannerConstantsSource,
  /value:\s*"companyNotice"[\s\S]*label:\s*"메인 : 미니캐러셀\(방금 들어온 무료신작 위\)"[\s\S]*shortLabel:\s*"메인 미니캐러셀"/,
  "CMS banner position tabs should expose the main company notice mini carousel slot",
);
assert.match(
  bannerEnumSource,
  /companyNotice:\s*"메인 : 미니캐러셀\(방금 들어온 무료신작 위\)"/,
  "CMS banner table should label company notice mini carousel banners",
);
assert.match(
  bannerImagePolicySource,
  /UNIFIED_CAROUSEL_BANNER_POSITIONS[\s\S]*"companyNotice"/,
  "company notice mini carousel should reuse one uploaded image across viewports",
);
assert.match(
  bannerImagePolicySource,
  /position === "companyNotice" \? "734x367\(2:1\)" : "364x414"/,
  "company notice mini carousel should show the 2:1 image guide",
);

for (const [name, source] of [
  ["add banner page", addSource],
  ["edit banner page", editSource],
] as const) {
  assert.match(
    source,
    /usesUnifiedBannerImage/,
    `${name} should branch carousel banner uploads through the unified-image policy`,
  );
  assert.doesNotMatch(
    source,
    /1100x400|400x350/,
    `${name} should not show obsolete wide/mobile carousel image dimensions`,
  );
  assert.doesNotMatch(
    source,
    /모바일 배너 이미지를 업로드해주세요/,
    `${name} should not require a separate mobile image for unified carousel banners`,
  );
}

assert.match(
  addSource,
  /mobile_image_id:\s*usesUnifiedBannerImage\s*\?\s*imageId(?:\s*\|\|\s*undefined)?\s*:/,
  "add banner should reuse the primary image id as mobile_image_id for unified carousel banners",
);
assert.match(
  editSource,
  /mobileImageId\s*=\s*image\s*\?\s*imageId\s*:/,
  "edit banner should reuse a newly uploaded primary image id for unified carousel banners",
);

for (const [name, source] of [
  ["banner list table", tableSource],
  ["sortable banner table", sortableTableSource],
] as const) {
  assert.match(
    source,
    /usesUnifiedBannerImage/,
    `${name} should apply the unified-image policy to thumbnail previews`,
  );
  assert.match(
    source,
    /!\s*(?:usesUnifiedBannerImage|isUnified)/,
    `${name} should hide the mobile thumbnail for unified carousel banners`,
  );
}

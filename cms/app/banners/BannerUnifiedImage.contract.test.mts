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

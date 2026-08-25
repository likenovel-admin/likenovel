import assert from "node:assert/strict";
import {
  canReorderBannerList,
  getBannerListPagination,
  getBannerReorderItems,
} from "./bannerListReorder.ts";

assert.deepEqual(getBannerListPagination("all", 2, 100), {
  page: 2,
  count_per_page: 100,
});
assert.deepEqual(getBannerListPagination("main-top", 1, 100), {
  page: -1,
  count_per_page: -1,
});

assert.equal(canReorderBannerList("main-top", 1), false);
assert.equal(canReorderBannerList("main-top", 100), true);
assert.equal(canReorderBannerList("main-top", 101), true);
assert.equal(canReorderBannerList("all", 101), false);

const latestUpdatedItems = [
  { id: 30, show_order: 3 },
  { id: 20, show_order: 1 },
  { id: 10, show_order: 1 },
  { id: 40, show_order: 2 },
];
const canonicalItems = getBannerReorderItems(latestUpdatedItems);

assert.deepEqual(
  canonicalItems.map((item) => item.id),
  [10, 20, 40, 30],
);
assert.deepEqual(
  latestUpdatedItems.map((item) => item.id),
  [30, 20, 10, 40],
  "canonicalization should not mutate the currently displayed list",
);

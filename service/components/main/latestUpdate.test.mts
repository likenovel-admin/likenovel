import assert from "node:assert/strict";
import test from "node:test";

import {
  LATEST_UPDATE_MAX_ITEMS,
  LATEST_UPDATE_MOBILE_PAGE_SIZE,
  clampLatestUpdatePage,
  filterLatestUpdateProducts,
  getLatestUpdateGenreTabs,
  paginateLatestUpdateProducts,
} from "./latestUpdate.ts";

const products = [
  { productId: 1, genre: ["현대판타지"], priceType: "free" as const },
  { productId: 2, genre: ["공포·미스테리"], priceType: "free" as const },
  { productId: 3, genre: ["판타지", "추리"], priceType: "free" as const },
  { productId: 4, genre: [], priceType: "free" as const },
  ...Array.from({ length: 22 }, (_, index) => ({
    productId: index + 5,
    genre: ["판타지"],
    priceType: "free" as const,
  })),
];

test("무료 업데이트 작품에 실제 존재하는 장르 탭만 첫 등장 순서로 보여준다", () => {
  const genreProducts = [
    {
      productId: 100,
      genre: ["판타지", "공포·미스테리"],
      priceType: "free" as const,
    },
    {
      productId: 101,
      genre: ["현대판타지", "판타지"],
      priceType: "free" as const,
    },
    {
      productId: 102,
      genre: ["로맨스"],
      priceType: "paid" as const,
    },
  ];

  assert.deepEqual(getLatestUpdateGenreTabs(genreProducts), [
    "전체",
    "판타지",
    "공포·미스테리",
    "현대판타지",
  ]);
});

test("전체 탭은 최신순을 보존하며 PC 3줄인 9개까지만 보여준다", () => {
  assert.equal(LATEST_UPDATE_MAX_ITEMS, 9);
  assert.deepEqual(
    filterLatestUpdateProducts(products, "전체").map(
      (product) => product.productId
    ),
    products
      .slice(0, LATEST_UPDATE_MAX_ITEMS)
      .map((product) => product.productId)
  );
});

test("무료 일반연재와 무료 자유연재를 모두 보여준다", () => {
  const mixedProductTypes = [
    {
      productId: 1001,
      genre: ["판타지"],
      priceType: "free" as const,
      productType: "normal" as const,
    },
    {
      productId: 1002,
      genre: ["판타지"],
      priceType: "free" as const,
      productType: "free" as const,
    },
    {
      productId: 1003,
      genre: ["판타지"],
      priceType: "paid" as const,
      productType: "normal" as const,
    },
  ];

  assert.deepEqual(
    filterLatestUpdateProducts(mixedProductTypes, "전체").map(
      (product) => product.productId
    ),
    [1001, 1002]
  );
});

test("유료 작품은 장르 및 개수 제한 전에 제외한다", () => {
  const mixedPriceProducts = [
    {
      productId: 999,
      genre: ["판타지"],
      priceType: "paid" as const,
    },
    ...products,
  ];
  const visibleProducts = filterLatestUpdateProducts(
    mixedPriceProducts,
    "전체"
  );

  assert.equal(visibleProducts.length, LATEST_UPDATE_MAX_ITEMS);
  assert.equal(
    visibleProducts.some((product) => product.productId === 999),
    false
  );
});

test("선택한 장르가 포함된 작품만 원래 순서대로 보여준다", () => {
  assert.deepEqual(
    filterLatestUpdateProducts(products, "판타지")
      .slice(0, 3)
      .map((product) => product.productId),
    [3, 5, 6]
  );
});

test("선택한 실제 장르가 포함된 작품만 보여준다", () => {
  assert.deepEqual(
    filterLatestUpdateProducts(products, "공포·미스테리").map(
      (product) => product.productId
    ),
    [2]
  );
});

test("모바일 작품 목록은 3개 단위 페이지로 나눈다", () => {
  assert.equal(LATEST_UPDATE_MOBILE_PAGE_SIZE, 3);
  assert.deepEqual(
    paginateLatestUpdateProducts(products.slice(0, 7)).map((page) =>
      page.map((product) => product.productId)
    ),
    [
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ]
  );
});

test("모바일 작품 수가 줄면 현재 페이지를 마지막 유효 페이지로 보정한다", () => {
  assert.equal(clampLatestUpdatePage(2, 1), 0);
  assert.equal(clampLatestUpdatePage(2, 2), 1);
  assert.equal(clampLatestUpdatePage(1, 3), 1);
  assert.equal(clampLatestUpdatePage(-1, 3), 0);
  assert.equal(clampLatestUpdatePage(1, 0), 0);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  LATEST_UPDATE_GENRE_TABS,
  LATEST_UPDATE_MAX_ITEMS,
  filterLatestUpdateProducts,
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

test("문피아 최신 무료 웹소설과 같은 장르 탭 순서를 사용한다", () => {
  assert.deepEqual(LATEST_UPDATE_GENRE_TABS, [
    "전체",
    "현대판타지",
    "판타지",
    "무협",
    "대체역사",
    "스포츠",
    "퓨전",
    "드라마",
    "전쟁·밀리터리",
    "로맨스",
    "게임",
    "SF",
    "기타",
  ]);
});

test("전체 탭은 최신순을 보존하며 21개까지만 보여준다", () => {
  assert.deepEqual(
    filterLatestUpdateProducts(products, "전체").map(
      (product) => product.productId
    ),
    products
      .slice(0, LATEST_UPDATE_MAX_ITEMS)
      .map((product) => product.productId)
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

test("기타 탭은 전용 탭 장르가 하나도 없는 작품만 보여준다", () => {
  assert.deepEqual(
    filterLatestUpdateProducts(products, "기타").map(
      (product) => product.productId
    ),
    [2, 4]
  );
});

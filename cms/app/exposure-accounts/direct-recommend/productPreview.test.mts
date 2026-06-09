import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  appendDirectRecommendProductId,
  buildDirectRecommendProductPreviewRows,
  removeDirectRecommendProductId,
} from "./productPreview.ts";

const rows = buildDirectRecommendProductPreviewRows(
  [1098, 1100, 9999, 1098],
  [
    {
      product_id: 1098,
      title: "회귀자의 귀환",
      author_nickname: "작가A",
      count_episode: 12,
      last_episode_date: "2026-06-01T12:30:00",
    },
    {
      product_id: 1100,
      title: "마법사의 밤",
      author_nickname: "작가B",
      count_episode: 34,
      last_episode_date: null,
    },
  ]
);

assert.deepEqual(rows, [
  {
    productId: 1098,
    title: "회귀자의 귀환",
    authorNickname: "작가A",
    countEpisode: 12,
    lastEpisodeDate: "2026-06-01T12:30:00",
    found: true,
  },
  {
    productId: 1100,
    title: "마법사의 밤",
    authorNickname: "작가B",
    countEpisode: 34,
    lastEpisodeDate: null,
    found: true,
  },
  {
    productId: 9999,
    title: null,
    authorNickname: null,
    countEpisode: null,
    lastEpisodeDate: null,
    found: false,
  },
  {
    productId: 1098,
    title: "회귀자의 귀환",
    authorNickname: "작가A",
    countEpisode: 12,
    lastEpisodeDate: "2026-06-01T12:30:00",
    found: true,
  },
]);

assert.equal(appendDirectRecommendProductId([], 1098), "1098");
assert.equal(
  appendDirectRecommendProductId([1098, 1100], 1103),
  "1098,1100,1103"
);
assert.equal(
  appendDirectRecommendProductId([1098, 1100], 1100),
  "1098,1100"
);
assert.equal(
  removeDirectRecommendProductId([1098, 1100, 1103], 1100),
  "1098,1103"
);
assert.equal(removeDirectRecommendProductId([1098], 1098), "");
assert.equal(removeDirectRecommendProductId([1098, 1100, 1098], 1098), "1100");

const component = readFileSync(
  new URL("./ProductIdPreview.tsx", import.meta.url),
  "utf8"
);
const productPreview = readFileSync(
  new URL("./productPreview.ts", import.meta.url),
  "utf8"
);
const addPage = readFileSync(new URL("./add/page.tsx", import.meta.url), "utf8");
const editPage = readFileSync(
  new URL("./[directRecommendId]/page.tsx", import.meta.url),
  "utf8"
);

for (const header of [
  "작품 ID",
  "작품명",
  "작가명",
  "회차수",
  "최근회차등록일",
  "관리",
]) {
  assert.match(component, new RegExp(header));
}

assert.match(component, /search_target: "product-id"/);
assert.match(component, /count_episode/);
assert.match(component, /lastEpisodeDate/);
assert.match(productPreview, /last_episode_date/);
assert.match(component, /author_nickname/);
assert.match(component, /삭제/);
assert.match(component, /handleRemoveProduct/);

assert.match(addPage, /<ProductIdPreview/);
assert.match(addPage, /productInput={product}/);
assert.match(addPage, /onProductInputChange={setProduct}/);
assert.match(editPage, /<ProductIdPreview/);
assert.match(editPage, /productInput={product}/);
assert.match(editPage, /onProductInputChange={setProduct}/);

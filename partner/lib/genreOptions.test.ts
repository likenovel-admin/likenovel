import assert from "node:assert/strict";
import { getPrimaryGenreOptions, getSubGenreOptions } from "./genreOptions.ts";

const genres = [
  { keyword_id: 1, keyword_name: "판타지", major_genre_yn: "Y" },
  { keyword_id: 19, keyword_name: "현대판타지", major_genre_yn: "Y" },
  { keyword_id: 21, keyword_name: "로맨스", major_genre_yn: "Y" },
  { keyword_id: 99, keyword_name: "태그", major_genre_yn: "N" },
];

assert.deepEqual(
  getPrimaryGenreOptions(genres).map((genre) => genre.keyword_name),
  ["판타지", "현대판타지"],
);

assert.deepEqual(
  getSubGenreOptions(genres, "1").map((genre) => genre.keyword_name),
  ["현대판타지", "로맨스"],
);

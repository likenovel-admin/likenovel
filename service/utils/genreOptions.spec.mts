import assert from "node:assert/strict";
import { getPrimaryGenreOptions, getSubGenreOptions } from "./genreOptions.ts";

const genres = ["판타지", "현대판타지", "로맨스"];

assert.deepEqual(getPrimaryGenreOptions(genres), ["판타지", "현대판타지"]);
assert.deepEqual(getSubGenreOptions(genres, "판타지"), ["현대판타지", "로맨스"]);

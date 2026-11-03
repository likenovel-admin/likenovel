import assert from "node:assert/strict";
import { contentSearchPath, readContentSearch } from "./contentSearch.ts";

const state = { keyword: "A&B [퇴마] +", tags: ["dna:goal:퇴마", "keyword:7"], orderby: "update" as const, page: 3 };
assert.deepEqual(readContentSearch(new URL(contentSearchPath(state), "https://example.test").searchParams), state);
assert.deepEqual(readContentSearch(new URLSearchParams("tag=dna:goal:퇴마&tag=dna:goal:퇴마&page=-1&orderby=unsafe")), { keyword: "", tags: ["dna:goal:퇴마"], orderby: "relevance", page: 1 });
assert.equal(readContentSearch(new URLSearchParams("page=NaN")).page, 1);
assert.equal(readContentSearch(new URLSearchParams("page=9999999")).page, 10000);
console.log("content search URL behavior passed");

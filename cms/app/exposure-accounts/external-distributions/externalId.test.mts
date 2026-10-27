import assert from "node:assert/strict";

import { buildExternalUrl, parseExternalId } from "./externalId.ts";

assert.equal(parseExternalId("kakaopage", "66438235"), "66438235");
assert.equal(
  parseExternalId("kakaopage", "https://page.kakao.com/content/66438235/"),
  "66438235"
);
assert.equal(
  parseExternalId("ridi", "https://ridibooks.com/books/4610005070?_s=search"),
  "4610005070"
);
// 다른 플랫폼 URL을 넣으면 거부한다.
assert.equal(parseExternalId("ridi", "https://page.kakao.com/content/66438235"), null);
assert.equal(parseExternalId("kakaopage", "카카오 링크"), null);
assert.equal(
  buildExternalUrl("ridi", "4610005070"),
  "https://ridibooks.com/books/4610005070"
);

console.log("externalId ok");

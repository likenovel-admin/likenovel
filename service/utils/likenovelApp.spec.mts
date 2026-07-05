import assert from "node:assert/strict";
import {
  LIKENOVEL_APP_HEADER,
  isLikenovelAppHeader,
  isLikenovelAppRequestHeaders,
  isLikenovelAppUserAgent,
} from "./likenovelApp.ts";

{
  assert.equal(
    isLikenovelAppUserAgent("Mozilla/5.0 Chrome/120 LikeNovelApp/prod"),
    true
  );
  assert.equal(isLikenovelAppUserAgent("Mozilla/5.0 Chrome/120"), false);
}

{
  assert.equal(isLikenovelAppHeader("LikeNovelApp/prod"), true);
  assert.equal(isLikenovelAppHeader("false"), false);
  assert.equal(isLikenovelAppHeader("0"), false);
  assert.equal(isLikenovelAppHeader(null), false);
}

{
  const headers = new Headers({
    [LIKENOVEL_APP_HEADER]: "LikeNovelApp/prod",
    "user-agent": "Mozilla/5.0",
  });

  assert.equal(isLikenovelAppRequestHeaders(headers), true);
}

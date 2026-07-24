import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./HomePageClient.tsx", import.meta.url),
  "utf8",
);

const middleMenuIndex = source.indexOf("<MiddleMenu");
const homeTickerIndex = source.indexOf("<HomeTicker", middleMenuIndex);
const freeTopIndex = source.indexOf("<FreeTop", homeTickerIndex);

assert.notEqual(middleMenuIndex, -1, "Home page should render MiddleMenu");
assert.notEqual(
  homeTickerIndex,
  -1,
  "Home page should render HomeTicker after MiddleMenu"
);
assert.notEqual(
  freeTopIndex,
  -1,
  "Home page should render FreeTop after HomeTicker"
);
assert.equal(
  middleMenuIndex < homeTickerIndex && homeTickerIndex < freeTopIndex,
  true,
  "HomeTicker should be placed between MiddleMenu and FreeTop"
);
assert.match(
  source,
  /useGetHomeTicker\(\s*adultYn,\s*homeQueryState\.enabled,\s*mainProductCacheIdentity\s*\)/,
  "Home page should call useGetHomeTicker with adult_yn, enabled state, and cache identity"
);
assert.match(
  source,
  /isSuccess:\s*isHomeTickerSuccess/,
  "Home page should read home ticker success state"
);
assert.match(
  source,
  /isHomeTickerSuccess && homeTickerData/,
  "Home page should hide HomeTicker while the API is pending or failed"
);
assert.match(
  source,
  /items=\{homeTickerData\.items\}/,
  "Home page should pass top-level home ticker items to HomeTicker"
);
assert.match(
  source,
  /rotateEveryMs=\{homeTickerData\.rotateEveryMs\}/,
  "Home page should pass top-level rotateEveryMs to HomeTicker"
);

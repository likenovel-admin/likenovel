import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./HomePageClient.tsx", import.meta.url),
  "utf8"
);

const freeTopIndex = source.indexOf("<FreeTop");
const latestUpdateIndex = source.indexOf("<LatestUpdate", freeTopIndex);
const recentlyViewIndex = source.indexOf("<RecentlyView", latestUpdateIndex);
const characterSlotIndex = source.indexOf("<CharacterSlot", recentlyViewIndex);

assert.notEqual(freeTopIndex, -1, "Home page should render FreeTop");
assert.notEqual(
  latestUpdateIndex,
  -1,
  "Home page should render the dedicated LatestUpdate section"
);
assert.notEqual(recentlyViewIndex, -1, "Home page should render RecentlyView");
assert.notEqual(characterSlotIndex, -1, "Home page should render CharacterSlot");
assert.equal(
  freeTopIndex < latestUpdateIndex &&
    latestUpdateIndex < recentlyViewIndex &&
    recentlyViewIndex < characterSlotIndex,
  true,
  "LatestUpdate should sit between FreeTop and the conditional RecentlyView before CharacterSlot"
);
assert.match(
  source,
  /<LatestUpdate products=\{latestUpdateProducts\} \/>/,
  "Home page should pass the existing latest-update API result without reshaping it"
);
assert.doesNotMatch(
  source,
  /suggestTitle:\s*"최신 업데이트 작품"/,
  "Home page should not keep the old latest-update cover carousel"
);

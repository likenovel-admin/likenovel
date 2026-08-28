import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/HomePageClient.tsx", "utf8");

const freeTopIndex = source.indexOf("<FreeTop");
const risingPickIndex = source.indexOf("<RisingPick");
const latestUpdateIndex = source.indexOf("<LatestUpdate");

assert.notEqual(risingPickIndex, -1, "Home page should render RisingPick");
assert.ok(
  freeTopIndex < risingPickIndex && risingPickIndex < latestUpdateIndex,
  "RisingPick should sit between FreeTop and LatestUpdate"
);

const component = readFileSync("components/main/RisingPick.tsx", "utf8");

assert.ok(
  component.includes('headerText="지금 오르는 중"'),
  "RisingPick header should reuse the public label"
);
assert.ok(
  component.includes("if (items.length === 0) return null;"),
  "RisingPick should hide itself when the backend returns no picks"
);
assert.ok(
  !/rankGain|recentHits|계단|배↑/.test(component),
  "RisingPick must not expose rise numbers"
);

console.log("rising pick placement contract ok");

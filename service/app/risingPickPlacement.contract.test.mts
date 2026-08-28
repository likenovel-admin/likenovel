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
  component.includes('headerText="조용히 반응 오는 중"'),
  "RisingPick header should reuse the public label"
);
assert.ok(
  /hasRankingGuide/.test(component) &&
    /rankingGuideMessages={RISING_PICK_GUIDE_MESSAGE}/.test(component),
  "RisingPick should expose its own selection-criteria tooltip"
);
assert.ok(
  !/RISING_PICK_GUIDE_MESSAGE[\s\S]*?\];/.test(component) ||
    !/\d+계단|\d+회 이상|\d+위 밖/.test(
      component.slice(
        component.indexOf("RISING_PICK_GUIDE_MESSAGE"),
        component.indexOf("];", component.indexOf("RISING_PICK_GUIDE_MESSAGE"))
      )
    ),
  "RisingPick tooltip must not expose raw threshold numbers"
);
assert.ok(
  component.includes("if (items.length === 0) return null;"),
  "RisingPick should hide itself when the backend returns no picks"
);
assert.ok(
  !/rankGain|recentHits|계단|배↑/.test(component),
  "RisingPick must not expose rise numbers"
);

assert.ok(
  !/bg-light-gray-100/.test(component),
  "RisingPick rows should not sit on a gray card background"
);
assert.ok(
  !/overflow-x-auto/.test(component),
  "RisingPick should not use mobile horizontal swipe"
);
assert.ok(
  component.indexOf("{item.title}") < component.indexOf("{item.comment}"),
  "RisingPick should show the title before the comment"
);
assert.ok(
  /line-clamp-2[^"]*text-dark-gray-400/.test(component),
  "RisingPick comment should stay muted and clamp to two lines"
);
assert.ok(
  /new_work: "✨"/.test(component) &&
    /comeback: "👀"/.test(component) &&
    /fresh_episode: "💬"/.test(component) &&
    /rising: "🔥"/.test(component),
  "RisingPick should map each rising type to a fixed emoji"
);

console.log("rising pick placement contract ok");

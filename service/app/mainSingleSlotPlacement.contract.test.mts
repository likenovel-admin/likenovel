import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const cpPromotionIndex = source.indexOf("<CPPromotion");
const visibleMixedSectionsMapIndex = source.indexOf("{visibleMixedSections.map");

assert.notEqual(cpPromotionIndex, -1, "Home page should render CP promotion");
assert.notEqual(
  visibleMixedSectionsMapIndex,
  -1,
  "Home page should render visible mixed recommendation sections",
);

const firstSlotImmediateAfterCpIndex = source.indexOf(
  "{betweenDirectRecommendFirstSingleSlot &&",
  cpPromotionIndex,
);

assert.equal(
  firstSlotImmediateAfterCpIndex === -1 ||
    firstSlotImmediateAfterCpIndex > visibleMixedSectionsMapIndex,
  true,
  "between_direct_recommend_1 should not render immediately after CP promotion",
);
assert.match(
  source,
  /\{visibleMixedSections\.map/,
  "single slots should be inserted against visible recommendation sections, not raw shuffled sections",
);
assert.doesNotMatch(
  source,
  /\{mixedSections\.map/,
  "empty mixed sections should not count as spacing between single slots",
);
assert.match(
  source,
  /index === firstSingleSlotAfterMixedIndex &&\s*betweenDirectRecommendFirstSingleSlot/,
  "between_direct_recommend_1 should render after the first visible mixed recommendation section",
);
assert.match(
  source,
  /index === secondSingleSlotAfterMixedIndex &&\s*betweenDirectRecommendSecondSingleSlot/,
  "between_direct_recommend_2 should render after the configured visible mixed recommendation section",
);

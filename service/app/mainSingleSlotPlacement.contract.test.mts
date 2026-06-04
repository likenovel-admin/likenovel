import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const cpPromotionIndex = source.indexOf("<CPPromotion");
const mixedSectionsMapIndex = source.indexOf("{mixedSections.map");

assert.notEqual(cpPromotionIndex, -1, "Home page should render CP promotion");
assert.notEqual(
  mixedSectionsMapIndex,
  -1,
  "Home page should render mixed recommendation sections",
);

const firstSlotImmediateAfterCpIndex = source.indexOf(
  "{betweenDirectRecommendFirstSingleSlot &&",
  cpPromotionIndex,
);

assert.equal(
  firstSlotImmediateAfterCpIndex === -1 ||
    firstSlotImmediateAfterCpIndex > mixedSectionsMapIndex,
  true,
  "between_direct_recommend_1 should not render immediately after CP promotion",
);
assert.match(
  source,
  /index === 0 && betweenDirectRecommendFirstSingleSlot/,
  "between_direct_recommend_1 should render after the first mixed recommendation section",
);
assert.match(
  source,
  /index === 2 && betweenDirectRecommendSecondSingleSlot/,
  "between_direct_recommend_2 should render after the third mixed recommendation section",
);

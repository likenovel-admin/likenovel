import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const recentlyViewIndex = source.indexOf("<RecentlyView");
const characterSlotIndex = source.indexOf("<CharacterSlot", recentlyViewIndex);
const mainRuleSlotIndex = source.indexOf(
  "{mainRuleSlotSections.length > 0",
  characterSlotIndex
);

assert.notEqual(recentlyViewIndex, -1, "Home page should render RecentlyView");
assert.notEqual(characterSlotIndex, -1, "Home page should render CharacterSlot");
assert.notEqual(mainRuleSlotIndex, -1, "Home page should render main rule slots");
assert.equal(
  recentlyViewIndex < characterSlotIndex && characterSlotIndex < mainRuleSlotIndex,
  true,
  "CharacterSlot should render after RecentlyView and before main rule slots"
);
assert.match(
  source,
  /mainCharacterSlotItems\.length > 0/,
  "CharacterSlot should stay hidden when CMS has no active cards"
);
assert.match(
  source,
  /<CharacterSlot items=\{mainCharacterSlotItems\} adultYn=\{adultYn\}/,
  "CharacterSlot should receive both cards and the current adult scope"
);

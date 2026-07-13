import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const characterSlotSource = readFileSync(
  new URL("../components/main/CharacterSlot.tsx", import.meta.url),
  "utf8"
);
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
assert.match(
  characterSlotSource,
  /aspect-\[364\/414\]/,
  "CharacterSlot images should preserve the main banner 364:414 ratio"
);
assert.match(
  characterSlotSource,
  /grid-cols-2/,
  "CharacterSlot should keep two columns on mobile"
);
assert.match(
  characterSlotSource,
  /text-dark-gray-400[^>]*>\s*\{item\.productTitle\}\s*<\/span>\s*<span[^>]*text-black-100[^>]*>\s*\{item\.characterName\}/,
  "CharacterSlot should show the work title as context before the emphasized character name"
);
assert.match(
  characterSlotSource,
  /buildHomeCharacterChatSessionRequest\([\s\S]*queueHomeCharacterChatLaunch\([\s\S]*router\.push\("\/websochat"\)/,
  "CharacterSlot should hand off a dedicated character-chat request and navigate immediately"
);
assert.doesNotMatch(
  characterSlotSource,
  /if \(hasAccountScope\) \{[\s\S]*getEpisodeListQueryOptions/,
  "CharacterSlot should resolve a backend-clamped read scope for guests as well as signed-in readers"
);
assert.match(
  characterSlotSource,
  /order_dir: "desc"[\s\S]*response\.data\.episodes\[0\]\?\.episodeNo/,
  "CharacterSlot should use the latest public episode row instead of the account read-progress field"
);

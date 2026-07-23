import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const characterSlotSource = readFileSync(
  new URL("../components/main/CharacterSlot.tsx", import.meta.url),
  "utf8"
);
const characterGridSource = readFileSync(
  new URL("../components/main/CharacterChatCardGrid.tsx", import.meta.url),
  "utf8"
);
const characterModalSource = readFileSync(
  new URL("../components/main/CharacterChatPreviewModal.tsx", import.meta.url),
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
  characterGridSource,
  /aspect-\[364\/414\]/,
  "CharacterSlot images should preserve the main banner 364:414 ratio"
);
assert.match(
  characterSlotSource,
  /grid-cols-2[^"]*md:grid-cols-4[^"]*lg:grid-cols-6/,
  "CharacterSlot should fill each viewport with 2, 4, and 6 columns"
);
assert.match(
  characterSlotSource,
  /useState\(12\)/,
  "CharacterSlot should render all 12 cards without desktop pagination"
);
assert.match(
  characterSlotSource,
  /desktop\.matches \? 12 : tablet\.matches \? 8 : 4/,
  "CharacterSlot should page by 12 on desktop, 8 on tablet, and 4 on mobile"
);
assert.match(
  characterSlotSource,
  /const hasPager = list\.length > pageSize/,
  "CharacterSlot should hide desktop pagination when all 12 cards fit"
);
assert.match(
  characterSlotSource,
  /hasMoreButton[\s\S]*router\.push\("\/product\/character-chat"\)/,
  "CharacterSlot should expose the catalog only through the existing header more action"
);
assert.match(
  characterSlotSource,
  /\(current - 1 \+ pageCount\) % pageCount[\s\S]*\(current \+ 1\) % pageCount/,
  "CharacterSlot arrows should loop in both directions"
);
assert.match(
  characterGridSource,
  /text-dark-gray-400[^>]*>\s*\{item\.productTitle\}\s*<\/span>\s*<span[^>]*text-black-100[^>]*>\s*\{item\.characterName\}/,
  "CharacterSlot should show the work title as context before the emphasized character name"
);
assert.match(
  characterGridSource,
  /buildHomeCharacterChatSessionRequest\([\s\S]*queueHomeCharacterChatLaunch\([\s\S]*router\.push\("\/websochat"\)/,
  "CharacterSlot should hand off a dedicated character-chat request and navigate immediately"
);
assert.doesNotMatch(
  characterGridSource,
  /if \(hasAccountScope\) \{[\s\S]*getEpisodeListQueryOptions/,
  "CharacterSlot should resolve a backend-clamped read scope for guests as well as signed-in readers"
);
assert.match(
  characterModalSource,
  /applyReadScope\(response\.data\.latestEpisodeNo\)/,
  "The character-chat modal should use account read progress"
);
assert.match(
  characterModalSource,
  /resolveCharacterChatEpisodeScope\(\{[\s\S]*entryEpisodeNo: item\.entryEpisodeNo,[\s\S]*preparedEpisodeNo: item\.syncedLatestEpisodeNo,[\s\S]*accountReadEpisodeNo/,
  "The character-chat modal should clamp progress to prepared episodes without going below the character entry episode"
);
assert.doesNotMatch(
  characterModalSource,
  /response\.data\.episodes\[0\]\?\.episodeNo/,
  "The character-chat modal should not use the latest public episode as read progress"
);
assert.match(
  characterGridSource,
  /~\{item\.syncedLatestEpisodeNo\}화까지/,
  "CharacterSlot should show the backend-synced chat scope on each portrait"
);
assert.match(
  characterGridSource,
  /item\.syncedLatestEpisodeNo > 0/,
  "CharacterSlot should not render an empty episode-scope badge"
);

const characterSlotSubtitles = [
  "읽은 회차에서 주인공과 마음대로 전개를 이어가보세요",
  "당신이 멈춘 회차에서 주인공과 바로 이어가보세요",
  "스포일러 걱정 없이, 읽은 데까지의 주인공과 대화해요",
  "원작에 없던 장면을 주인공과 함께 만들어보세요",
  "지금 읽은 만큼만 아는 주인공과 이야기해보세요",
  "내가 읽은 그 순간의 주인공과 새로운 이야기를 이어가보세요",
];

assert.match(
  characterSlotSource,
  /const CHARACTER_SLOT_SECTION_TITLE =\s*"다음 회차를 기다리는 동안, 주인공챗";/,
  "CharacterSlot should explain the wait-time use case in its title"
);
for (const subtitle of characterSlotSubtitles) {
  assert.ok(
    characterSlotSource.includes(`"${subtitle}"`),
    `CharacterSlot should include the subtitle: ${subtitle}`
  );
}
assert.match(
  characterSlotSource,
  /Math\.floor\(Math\.random\(\) \* CHARACTER_SLOT_SECTION_SUBTITLES\.length\)/,
  "CharacterSlot should select one subtitle per client visit"
);
assert.match(
  characterSlotSource,
  /\{CHARACTER_SLOT_SECTION_SUBTITLES\[subtitleIndex\]\}/,
  "CharacterSlot should render the selected subtitle"
);
assert.doesNotMatch(
  characterSlotSource,
  /shuffleCharacterSlotItems|setOrderedItemIds/,
  "CharacterSlot should preserve the CMS card order"
);

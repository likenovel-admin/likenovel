import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterCharacterChatCatalog,
  isPersonalizedCharacterChatCatalogScope,
  parseCharacterChatCatalogScope,
  parseCharacterChatCatalogSort,
  resolveCharacterChatCatalogScope,
} from "./catalogFilter.ts";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const querySource = readFileSync(
  new URL("../../api/query/product/index.ts", import.meta.url),
  "utf8"
);
const dtoSource = readFileSync(
  new URL("../../api/query/product/dto.ts", import.meta.url),
  "utf8"
);
const gridSource = readFileSync(
  new URL("../../../components/main/CharacterChatCardGrid.tsx", import.meta.url),
  "utf8"
);
const modalSource = readFileSync(
  new URL("../../../components/main/CharacterChatPreviewModal.tsx", import.meta.url),
  "utf8"
);
const modalContainerSource = readFileSync(
  new URL("../../../components/common/ModalContainer.tsx", import.meta.url),
  "utf8"
);
const bottomSheetContainerSource = readFileSync(
  new URL("../../../components/common/BottomSheetContainer.tsx", import.meta.url),
  "utf8"
);

assert.match(
  querySource,
  /\/v1\/query\/products\/character-chat-catalog\?adult_yn=/,
  "The catalog page should use the full approved character endpoint"
);
assert.match(
  querySource,
  /return useQuery<IGetCharacterChatCatalogResponse>\(\{/,
  "The catalog hook should retain its personalized response type"
);
assert.match(
  querySource,
  /\/v1\/query\/products\/\$\{productId\}\/character-chat-preview/,
  "The modal should load the selected episode preview from the API"
);
assert.match(pageSource, /내가 읽은 시점의 주인공과 대화/);
assert.match(pageSource, /import Return from "\/public\/images\/return\.svg"/);
assert.match(
  pageSource,
  /import \{ findPreviousNonMatchingPath \} from "@\/utils\/navigationHistory"/,
  "The previous-page control should use the app navigation history"
);
assert.match(pageSource, /const router = useRouter\(\)/);
assert.match(
  pageSource,
  /const handleGoBack = \(\) => \{/,
  "The previous-page control should use a named handler"
);
assert.match(
  pageSource,
  /findPreviousNonMatchingPath\(\[\s*\/\^\\\/product\\\/character-chat\$\/,\s*\]\)/,
  "The previous-page control should exclude the current catalog route"
);
assert.match(
  pageSource,
  /if \(previousPath\) \{[\s\S]*router\.push\(previousPath\);[\s\S]*return;[\s\S]*\}/,
  "The previous-page control should push the previous app-history path"
);
assert.match(
  pageSource,
  /router\.push\("\/"\);/,
  "The previous-page control should fall back to home"
);
assert.match(
  pageSource,
  /type="button"[\s\S]*aria-label="이전 페이지"[\s\S]*onClick=\{handleGoBack\}[\s\S]*<Return[\s\S]*이전 페이지/,
  "The catalog should provide the established previous-page control"
);
assert.doesNotMatch(pageSource, /router\.back\(\)/);
assert.match(pageSource, /px-16pxr md:px-24pxr lg:px-32pxr/);
assert.match(pageSource, /max-w-\[1120px\]/);
assert.match(
  pageSource,
  /text-20pxr[^\"]*font-bold[^\"]*md:text-22pxr/,
  "The catalog title should use the design-system page-title scale"
);
assert.match(
  pageSource,
  /text-14pxr[^\"]*text-dark-gray-500/,
  "The catalog subtitle should use the design-system subtitle size"
);
assert.doesNotMatch(pageSource, /text-28pxr/);
assert.match(
  pageSource,
  /grid-cols-2[^\"]*md:grid-cols-4[^\"]*lg:grid-cols-5[^\"]*xl:grid-cols-6/,
  "The catalog should respond 2, 4, 5, and at most 6 columns"
);
assert.match(
  pageSource,
  /gap-x-10pxr gap-y-20pxr[^\"]*md:gap-x-20pxr/,
  "The catalog should use the established mobile and desktop grid gaps"
);
assert.doesNotMatch(pageSource, /gap-y-24pxr|gap-y-28pxr|gap-x-16pxr/);
assert.match(pageSource, /<CharacterChatCardGrid/);
assert.match(pageSource, /entrySource="character_catalog"/);
assert.match(pageSource, /\{ label: "전체", value: "all" \}/);
assert.match(pageSource, /\{ label: "읽고 있는 작품", value: "reading" \}/);
assert.doesNotMatch(pageSource, /처음 보는 작품/);
assert.match(pageSource, /\{ label: "추천순", value: "recommended" \}/);
assert.match(pageSource, /\{ label: "등록순", value: "latest" \}/);
assert.match(pageSource, /aria-pressed=\{activeScope === scope\.value\}/);
assert.match(pageSource, /ariaLabel="작품 범위 선택"/);
assert.match(pageSource, /ariaLabel="정렬 방식 선택"/);
assert.match(pageSource, /className="md:hidden"/);
assert.match(
  pageSource,
  /\/login\?modal=open&redirect=/,
  "Guest personalized filters should use the established login modal flow"
);
assert.match(
  pageSource,
  /searchParams\.get\("scope"\)/,
  "The URL query should remain the catalog-scope source of truth"
);
assert.match(
  pageSource,
  /searchParams\.get\("sort"\)/,
  "The URL query should keep sorting independent from scope"
);
assert.match(
  pageSource,
  /isPersonalizedCharacterChatCatalogScope\(requestedScope\)[\s\S]*queryState\.productCacheIdentity === "guest"[\s\S]*handleScopeChange\("all"\)/,
  "A guest-only personalized query should normalize back to all"
);
assert.match(
  pageSource,
  /isPersonalizedCharacterChatCatalogScope\(scope\)[\s\S]*!canUsePersonalizedScope/,
  "The login gate should use the shared personalized-scope helper"
);
assert.equal(
  pageSource.match(/isPersonalizedCharacterChatCatalogScope\(/g)?.length,
  4,
  "Login, desktop, mobile, and normalization gates should share the personalized-scope helper"
);
assert.match(
  pageSource,
  /localMockEnabled/,
  "The localhost mock should remain available for personalized-filter QA"
);
assert.match(pageSource, /전체 보기/);
assert.match(
  pageSource,
  /window\.location\.hostname === "localhost"/,
  "The visual mock should only activate on localhost"
);
assert.match(
  pageSource,
  /searchParams\.get\("mock"\) === "1"/,
  "The visual mock should require the explicit mock=1 query"
);
assert.match(
  pageSource,
  /queryState\.enabled && localMockEnabled === false/,
  "The visual mock should not call the real catalog API"
);
assert.match(
  pageSource,
  /LOCAL_MOCK_ITEMS\.map\(\(item\) => \[\s*item\.productId,\s*item\.lastViewedEpisodeNo \?\? 0,/,
  "Unread mock cards should open at the first-episode scope"
);
assert.match(
  pageSource,
  /fullReady:[\s\S]*readinessCoverageRatio:/,
  "Local catalog mocks should expose recommendation readiness"
);
const homeDtoStart = dtoSource.indexOf(
  "export interface IMainCharacterSlotItem"
);
const catalogDtoStart = dtoSource.indexOf(
  "export interface ICharacterChatCatalogItem"
);
assert.ok(homeDtoStart >= 0 && catalogDtoStart > homeDtoStart);
assert.doesNotMatch(
  dtoSource.slice(homeDtoStart, catalogDtoStart),
  /lastViewedEpisodeNo|lastViewedAt/,
  "Home character slot DTOs should not contain catalog personalization"
);
assert.match(
  dtoSource.slice(catalogDtoStart),
  /createdDate: string;[\s\S]*chatQuality: "good" \| "normal";[\s\S]*fullReady: boolean;[\s\S]*readinessCoverageRatio: number;[\s\S]*distinctEpisodeCount: number;[\s\S]*exampleCount: number;[\s\S]*sceneCount: number;[\s\S]*lastViewedEpisodeNo: number \| null;[\s\S]*lastViewedAt: string \| null;/,
  "Catalog DTOs should expose registration, asset completeness, and nullable reading progress"
);
assert.doesNotMatch(
  dtoSource.slice(homeDtoStart, catalogDtoStart),
  /fullReady|readinessCoverageRatio/,
  "Home character slot DTOs should not contain catalog-only recommendation readiness"
);
assert.match(gridSource, /<CharacterChatPreviewModal/);
assert.match(gridSource, /aspect-\[364\/414\]/);
assert.match(gridSource, /aria-haspopup="dialog"/);
assert.match(
  gridSource,
  /text-14pxr font-bold[^\"]*text-black-100/,
  "Character names should use an allowed emphasized font weight"
);
assert.doesNotMatch(gridSource, /font-semibold/);
assert.match(modalSource, /몇 화에서 주인공과 만날까요\?/);
assert.match(modalSource, /선택한 회차 이후의 내용은 대화에 반영하지 않아요/);
assert.doesNotMatch(
  modalSource,
  /선택한 회차까지의 작품 설정과 캐릭터 관계를 기억하고 대화해요/
);
assert.match(modalSource, /장면 요약/);
assert.match(modalSource, /원문 장면/);
assert.match(modalSource, /useGetCharacterChatPreview/);
assert.match(
  modalSource,
  /readScopeStatus === "ready" && !previewDetail/,
  "Mock preview details should suppress the real preview API"
);
const sceneSummaryIndex = modalSource.indexOf("장면 요약");
assert.ok(
  modalSource.indexOf("성격") < sceneSummaryIndex &&
    modalSource.indexOf("대화 스타일") < sceneSummaryIndex,
  "Character personality and speech style should appear before episode scenes"
);
assert.match(
  modalSource,
  /min-h-0 flex-1 overflow-y-auto/,
  "The modal body should scroll independently above the fixed footer"
);
const fixedFooterIndex = modalSource.indexOf(
  "shrink-0 border-t border-light-gray-200 bg-white"
);
const readEpisodeControlIndex = modalSource.indexOf(
  "몇 화에서 주인공과 만날까요?"
);
const launchButtonIndex = modalSource.indexOf(
  "onClick={() => onLaunch(item, selectedEpisodeNo)}"
);
assert.ok(
  fixedFooterIndex >= 0 &&
    readEpisodeControlIndex > fixedFooterIndex &&
    launchButtonIndex > readEpisodeControlIndex,
  "The read-episode control should live in the fixed footer directly above the CTAs"
);
assert.match(modalSource, /selectedEpisodeNo/);
assert.match(modalSource, /화의 \$\{item\.characterName\}에게 말 걸기/);
assert.match(pageSource, /previewDetailByProduct/);
assert.match(modalSource, /personalityCore/);
assert.match(modalSource, /speechStyle/);
assert.match(modalSource, /<select/);
assert.match(
  modalSource,
  /getEpisodeListQueryOptions/,
  "The account read scope should load when the preview opens"
);
assert.match(
  gridSource,
  /handleCharacterClick\(item, selectedEpisodeNo\)/,
  "The selected spoiler ceiling should be passed to chat launch"
);
assert.match(modalContainerSource, /panelRef\?: Ref<HTMLDivElement>/);
assert.match(modalContainerSource, /panelProps\?: HTMLAttributes<HTMLDivElement>/);
assert.match(modalContainerSource, /ref=\{panelRef\}/);
assert.match(modalContainerSource, /\{\.\.\.panelProps\}/);
assert.match(modalContainerSource, /aria-label="닫기"/);
assert.match(bottomSheetContainerSource, /panelRef\?: Ref<HTMLDivElement>/);
assert.match(
  bottomSheetContainerSource,
  /panelProps\?: HTMLAttributes<HTMLDivElement>/
);
assert.match(bottomSheetContainerSource, /ref=\{panelRef\}/);
assert.match(bottomSheetContainerSource, /\{\.\.\.panelProps\}/);
assert.match(modalSource, /const dialogRef = useRef<HTMLDivElement \| null>\(null\)/);
assert.match(modalSource, /event\.key === "Escape"/);
assert.match(modalSource, /event\.key !== "Tab"/);
assert.match(modalSource, /event\.shiftKey/);
assert.match(
  modalSource,
  /activeElement === dialog/,
  "Shift+Tab from the initially focused dialog panel must stay inside the modal"
);
assert.match(modalSource, /returnFocusElement\.focus\(\)/);
assert.match(modalSource, /role: "dialog"/);
assert.match(modalSource, /"aria-modal": true/);
assert.match(modalSource, /tabIndex: -1/);
assert.match(modalSource, /characterSlotId: null as number \| null/);
assert.match(
  modalSource,
  /if \(!item\) \{[\s\S]*characterSlotId: null,[\s\S]*status: "idle"/,
  "Closing the modal must clear the previous card's resolved read scope"
);
assert.match(
  modalSource,
  /readScope\.characterSlotId === item\.characterSlotId/,
  "A newly selected card must not inherit another card's read scope"
);
assert.match(
  modalSource,
  /key=\{`\$\{item\.characterSlotId\}:\$\{currentReadScope\.status\}:\$\{currentReadScope\.initialReadEpisodeNo\}`\}/,
  "The preview content should remount when its item or resolved read scope changes"
);
assert.match(
  pageSource,
  /!showLoading &&\s*!showError &&\s*filteredItems\.length > 0/,
  "Loading and error states must not leave stale cards interactive"
);

const catalogItems = [
  {
    characterSlotId: 30,
    cardOrder: 30,
    createdDate: "2026-07-20T10:00:00+09:00",
    chatQuality: "normal",
    fullReady: false,
    readinessCoverageRatio: 1,
    distinctEpisodeCount: 1,
    exampleCount: 1,
    sceneCount: 1,
    syncedLatestEpisodeNo: 999,
    lastViewedEpisodeNo: null,
    lastViewedAt: null,
  },
  {
    characterSlotId: 12,
    cardOrder: 2,
    createdDate: "2026-07-22T10:00:00+09:00",
    chatQuality: "normal",
    fullReady: true,
    readinessCoverageRatio: 0.8,
    distinctEpisodeCount: 1,
    exampleCount: 1,
    sceneCount: 1,
    syncedLatestEpisodeNo: 1,
    lastViewedEpisodeNo: 4,
    lastViewedAt: "2026-07-22T10:00:00+09:00",
  },
  {
    characterSlotId: 11,
    cardOrder: 2,
    createdDate: "2026-07-22T10:00:00+09:00",
    chatQuality: "normal",
    fullReady: true,
    readinessCoverageRatio: 0.8,
    distinctEpisodeCount: 1,
    exampleCount: 1,
    sceneCount: 1,
    syncedLatestEpisodeNo: 500,
    lastViewedEpisodeNo: 8,
    lastViewedAt: "2026-07-22T10:00:00+09:00",
  },
  {
    characterSlotId: 20,
    cardOrder: 1,
    createdDate: "2026-07-23T09:00:00+09:00",
    chatQuality: "normal",
    fullReady: true,
    readinessCoverageRatio: 0.8,
    distinctEpisodeCount: 1,
    exampleCount: 1,
    sceneCount: 1,
    syncedLatestEpisodeNo: 2,
    lastViewedEpisodeNo: 3,
    lastViewedAt: "2026-07-23T09:00:00+09:00",
  },
  {
    characterSlotId: 31,
    cardOrder: 31,
    createdDate: "2026-07-21T10:00:00+09:00",
    chatQuality: "normal",
    fullReady: true,
    readinessCoverageRatio: 0.4,
    distinctEpisodeCount: 1,
    exampleCount: 1,
    sceneCount: 1,
    syncedLatestEpisodeNo: 1000,
    lastViewedEpisodeNo: null,
    lastViewedAt: null,
  },
] as const;
const catalogSnapshot = structuredClone(catalogItems);

assert.equal(parseCharacterChatCatalogScope(null), "all");
assert.equal(parseCharacterChatCatalogScope("unknown"), "all");
assert.equal(parseCharacterChatCatalogScope("reading"), "reading");
assert.equal(parseCharacterChatCatalogSort(null), "recommended");
assert.equal(parseCharacterChatCatalogSort("unknown"), "recommended");
assert.equal(parseCharacterChatCatalogSort("latest"), "latest");

const recommendedItems = filterCharacterChatCatalog(
  catalogItems,
  "all",
  "recommended"
);
assert.deepEqual(
  recommendedItems.map((item) => item.characterSlotId),
  [11, 12, 20, 31, 30],
  "Recommended should ignore CMS card order and use a stable character-slot id tie-break"
);
const completenessOrderedItems = (
  [
    [8, 1, "normal", true, 0.9, 99, 99, 99],
    [7, 2, "good", false, 0.1, 1, 1, 1],
    [6, 3, "good", true, 0.1, 0, 0, 0],
    [5, 4, "good", true, 0.2, 0, 0, 0],
    [4, 5, "good", true, 0.2, 2, 0, 0],
    [3, 6, "good", true, 0.2, 2, 2, 0],
    [2, 7, "good", true, 0.2, 2, 2, 2],
    [1, 8, "good", true, 0.2, 2, 2, 2],
  ] as const
).map(
  ([
    characterSlotId,
    cardOrder,
    chatQuality,
    fullReady,
    readinessCoverageRatio,
    distinctEpisodeCount,
    exampleCount,
    sceneCount,
  ]) => ({
    characterSlotId,
    cardOrder,
    createdDate: "2026-07-23T09:00:00+09:00",
    chatQuality,
    fullReady,
    readinessCoverageRatio,
    distinctEpisodeCount,
    exampleCount,
    sceneCount,
    lastViewedEpisodeNo: null,
  })
);
assert.deepEqual(
  filterCharacterChatCatalog(
    completenessOrderedItems,
    "all",
    "recommended"
  ).map((item) => item.characterSlotId),
  [1, 2, 3, 4, 5, 6, 8, 7],
  "Recommended should rank full readiness, quality, coverage, episode diversity, examples, scenes, then stable id"
);
const episodeCountChangedItems = catalogItems.map((item, index) => ({
  ...item,
  syncedLatestEpisodeNo: index % 2 === 0 ? 0 : 10_000,
}));
assert.deepEqual(
  filterCharacterChatCatalog(
    episodeCountChangedItems,
    "all",
    "recommended"
  ).map((item) => item.characterSlotId),
  recommendedItems.map((item) => item.characterSlotId),
  "Recommended order should be independent of synced episode counts"
);

const latestItems = filterCharacterChatCatalog(catalogItems, "all", "latest");
assert.deepEqual(
  latestItems.map((item) => item.characterSlotId),
  [20, 12, 11, 31, 30],
  "Latest should sort by catalog registration date and id descending"
);
assert.notEqual(
  latestItems,
  catalogItems,
  "Filtering and sorting should return a new array"
);

const readingItems = filterCharacterChatCatalog(
  catalogItems,
  "reading",
  "recommended"
);
assert.deepEqual(
  readingItems.map((item) => item.characterSlotId),
  [11, 12, 20],
  "Reading scope should retain the selected recommended sort"
);

const latestReadingItems = filterCharacterChatCatalog(
  catalogItems,
  "reading",
  "latest"
);
assert.deepEqual(
  latestReadingItems.map((item) => item.characterSlotId),
  [20, 12, 11],
  "Reading scope should combine independently with registration order"
);
assert.deepEqual(
  catalogItems,
  catalogSnapshot,
  "Filtering and sorting must not mutate the API response"
);
assert.equal(
  resolveCharacterChatCatalogScope("reading", false),
  "all",
  "Guest reading queries should render the all scope"
);
assert.equal(
  resolveCharacterChatCatalogScope("all", false),
  "all",
  "Guest all scope should remain available"
);
assert.equal(
  resolveCharacterChatCatalogScope("reading", true),
  "reading",
  "Authenticated reading queries should remain personalized"
);
assert.equal(isPersonalizedCharacterChatCatalogScope("all"), false);
assert.equal(isPersonalizedCharacterChatCatalogScope("reading"), true);

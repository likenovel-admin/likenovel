import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterCharacterChatCatalog,
  isPersonalizedCharacterChatCatalogFilter,
  parseCharacterChatCatalogFilter,
  resolveCharacterChatCatalogFilter,
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
assert.match(pageSource, /\{ label: "추천순", value: "recommended" \}/);
assert.ok(
  pageSource.indexOf('{ label: "추천순", value: "recommended" }') <
    pageSource.indexOf('{ label: "전체", value: "all" }'),
  "Recommended should be the first catalog filter"
);
assert.match(pageSource, /\{ label: "전체", value: "all" \}/);
assert.match(pageSource, /\{ label: "읽고 있는 작품", value: "reading" \}/);
assert.match(
  pageSource,
  /\{ label: "처음 보는 작품", value: "unread" \}/
);
assert.match(pageSource, /aria-pressed=\{activeFilter === filter\.value\}/);
assert.match(
  pageSource,
  /\/login\?modal=open&redirect=/,
  "Guest personalized filters should use the established login modal flow"
);
assert.match(
  pageSource,
  /const searchParams = useSearchParams\(\)/,
  "The URL query should remain the catalog-filter source of truth"
);
assert.match(
  pageSource,
  /isPersonalizedCharacterChatCatalogFilter\(requestedFilter\)[\s\S]*queryState\.productCacheIdentity === "guest"[\s\S]*handleFilterChange\("recommended"\)/,
  "A guest-only personalized query should normalize back to recommended"
);
assert.match(
  pageSource,
  /isPersonalizedCharacterChatCatalogFilter\(filter\)[\s\S]*!canUsePersonalizedFilters/,
  "The login gate should use the shared personalized-filter helper"
);
assert.match(
  pageSource,
  /disabled=\{[\s\S]*isPersonalizedCharacterChatCatalogFilter\(filter\.value\)[\s\S]*!isAuthInitialized/,
  "The initialization gate should use the shared personalized-filter helper"
);
assert.equal(
  pageSource.match(/isPersonalizedCharacterChatCatalogFilter\(/g)?.length,
  3,
  "Login, initialization, and normalization gates should share the personalized-filter helper"
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
  /fullReady: boolean;[\s\S]*readinessCoverageRatio: number;[\s\S]*lastViewedEpisodeNo: number \| null;[\s\S]*lastViewedAt: string \| null;/,
  "Catalog DTOs should expose recommendation readiness and nullable reading progress"
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
    fullReady: false,
    readinessCoverageRatio: 1,
    syncedLatestEpisodeNo: 999,
    lastViewedEpisodeNo: null,
    lastViewedAt: null,
  },
  {
    characterSlotId: 12,
    cardOrder: 2,
    fullReady: true,
    readinessCoverageRatio: 0.8,
    syncedLatestEpisodeNo: 1,
    lastViewedEpisodeNo: 4,
    lastViewedAt: "2026-07-22T10:00:00+09:00",
  },
  {
    characterSlotId: 11,
    cardOrder: 2,
    fullReady: true,
    readinessCoverageRatio: 0.8,
    syncedLatestEpisodeNo: 500,
    lastViewedEpisodeNo: 8,
    lastViewedAt: "2026-07-22T10:00:00+09:00",
  },
  {
    characterSlotId: 20,
    cardOrder: 1,
    fullReady: true,
    readinessCoverageRatio: 0.8,
    syncedLatestEpisodeNo: 2,
    lastViewedEpisodeNo: 3,
    lastViewedAt: "2026-07-23T09:00:00+09:00",
  },
  {
    characterSlotId: 31,
    cardOrder: 31,
    fullReady: true,
    readinessCoverageRatio: 0.4,
    syncedLatestEpisodeNo: 1000,
    lastViewedEpisodeNo: null,
    lastViewedAt: null,
  },
] as const;
const catalogSnapshot = structuredClone(catalogItems);

assert.equal(parseCharacterChatCatalogFilter(null), "recommended");
assert.equal(parseCharacterChatCatalogFilter("unknown"), "recommended");
assert.equal(parseCharacterChatCatalogFilter("all"), "all");

const recommendedItems = filterCharacterChatCatalog(
  catalogItems,
  "recommended"
);
assert.deepEqual(
  recommendedItems.map((item) => item.characterSlotId),
  [20, 11, 12, 31, 30],
  "Recommended should sort by full readiness, coverage, card order, and id without using episode count"
);
const episodeCountChangedItems = catalogItems.map((item, index) => ({
  ...item,
  syncedLatestEpisodeNo: index % 2 === 0 ? 0 : 10_000,
}));
assert.deepEqual(
  filterCharacterChatCatalog(episodeCountChangedItems, "recommended").map(
    (item) => item.characterSlotId
  ),
  recommendedItems.map((item) => item.characterSlotId),
  "Recommended order should be independent of synced episode counts"
);

const allItems = filterCharacterChatCatalog(catalogItems, "all");
assert.deepEqual(
  allItems.map((item) => item.characterSlotId),
  [30, 12, 11, 20, 31],
  "All should preserve the CMS response order"
);
assert.notEqual(allItems, catalogItems, "Filtering should return a new array");

const readingItems = filterCharacterChatCatalog(catalogItems, "reading");
assert.deepEqual(
  readingItems.map((item) => item.characterSlotId),
  [20, 11, 12],
  "Reading should sort by lastViewedAt desc, then cardOrder and id"
);

const unreadItems = filterCharacterChatCatalog(catalogItems, "unread");
assert.deepEqual(
  unreadItems.map((item) => item.characterSlotId),
  [30, 31],
  "Unread should preserve the CMS response order"
);
assert.deepEqual(
  catalogItems,
  catalogSnapshot,
  "Filtering and sorting must not mutate the API response"
);
assert.equal(
  resolveCharacterChatCatalogFilter("reading", false),
  "recommended",
  "Guest reading queries should render the recommended view"
);
assert.equal(
  resolveCharacterChatCatalogFilter("unread", false),
  "recommended",
  "Guest unread queries should render the recommended view"
);
assert.equal(
  resolveCharacterChatCatalogFilter("recommended", false),
  "recommended",
  "Guest recommended queries should remain available"
);
assert.equal(
  resolveCharacterChatCatalogFilter("all", false),
  "all",
  "Guest all queries should remain available"
);
assert.equal(
  resolveCharacterChatCatalogFilter("reading", true),
  "reading",
  "Authenticated reading queries should remain personalized"
);
assert.equal(isPersonalizedCharacterChatCatalogFilter("recommended"), false);
assert.equal(isPersonalizedCharacterChatCatalogFilter("all"), false);
assert.equal(isPersonalizedCharacterChatCatalogFilter("reading"), true);
assert.equal(isPersonalizedCharacterChatCatalogFilter("unread"), true);

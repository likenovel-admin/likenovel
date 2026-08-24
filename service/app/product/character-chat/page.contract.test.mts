import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterCharacterChatCatalog,
  getCharacterChatCatalogPaging,
  isPersonalizedCharacterChatCatalogScope,
  parseCharacterChatCatalogRole,
  parseCharacterChatCatalogScope,
  parseCharacterChatCatalogSort,
  pinHomeCharacterSlots,
  resolveCharacterChatCatalogScope,
} from "./catalogFilter.ts";
import { getCharacterChatRoleMeta } from "../../../utils/characterChatRole.ts";

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
const homeSlotSource = readFileSync(
  new URL("../../../components/main/CharacterSlot.tsx", import.meta.url),
  "utf8"
);
const modalSource = readFileSync(
  new URL("../../../components/main/CharacterChatPreviewModal.tsx", import.meta.url),
  "utf8"
);
const roleSource = readFileSync(
  new URL("../../../utils/characterChatRole.ts", import.meta.url),
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
  /export const getCharacterChatCatalogQueryOptions = \([\s\S]*queryOptions<IGetCharacterChatCatalogResponse>/,
  "The catalog hook should expose one reusable typed query definition"
);
assert.match(
  querySource,
  /return useQuery\(\{\s*\.\.\.getCharacterChatCatalogQueryOptions\([\s\S]*enabled,\s*\}\);/,
  "The catalog page should consume the same query definition used by home prefetch"
);
assert.match(
  querySource,
  /export const getMainCharacterSlotsQueryKey = \([\s\S]*\["getMainCharacterSlots", adultYnParam, cacheIdentity\] as const;/,
  "Home and catalog should share one cache key for the existing character slots"
);
assert.match(
  querySource,
  /useGetMainCharacterSlots[\s\S]*queryKey: getMainCharacterSlotsQueryKey\(adult_yn, cacheIdentity\)/,
  "The home character-slot query should use the shared cache key"
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
  /useMemo\(\s*\(\) =>\s*filterCharacterChatCatalog\(/,
  "Catalog filtering and sorting should be memoized"
);
assert.match(
  pageSource,
  /const visibleItemCount = catalogPaging\.batchSize \* visibleBatchCount;/,
  "The visible count should grow in breakpoint-sized two-row batches"
);
assert.match(
  pageSource,
  /orderedItems\.slice\(0, visibleItemCount\)/,
  "The catalog should slice the home-pinned results to the current visible count"
);
assert.match(
  pageSource,
  /items=\{visibleItems\}/,
  "The grid should render the visible window of the home-pinned catalog"
);
assert.match(
  pageSource,
  /<CharacterChatCardGrid[\s\S]*items=\{visibleItems\}[\s\S]*priorityItemCount=\{4\}/,
  "The catalog should prioritize only its first visible mobile batch"
);
assert.match(
  pageSource,
  /queryClient\.getQueryData<IGetMainCharacterSlotsResponse>\(\s*getMainCharacterSlotsQueryKey\(\s*adultYn,\s*queryState\.productCacheIdentity\s*\)\s*\)/,
  "The catalog should reuse the exact home character-slot cache entry"
);
assert.match(
  pageSource,
  /const isDefaultCatalogView =\s*activeScope === "all" &&\s*activeRole === "all" &&\s*activeSort === "recommended";/,
  "Random home slots should only seed the unfiltered default catalog view"
);
assert.match(
  pageSource,
  /const isHomeEntry = searchParams\.get\("from"\) === "home";/,
  "Only an explicit home entry should pin the home character slots"
);
assert.match(
  pageSource,
  /const canUseHomeSeed =[\s\S]*isHomeEntry[\s\S]*isDefaultCatalogView[\s\S]*slotSeedItems\.length > 0;/,
  "The home cards should stay pinned in the unfiltered recommended view"
);
assert.match(
  pageSource,
  /pinHomeCharacterSlots\(slotSeedItems, filteredItems\)/,
  "The authoritative catalog should append after the exact cached home order"
);
assert.match(
  pageSource,
  /const showLoading =[\s\S]*!canUseHomeSeed;/,
  "A usable slot seed should replace the blocking spinner"
);
assert.match(
  pageSource,
  /const showError =[\s\S]*isError && !canUseHomeSeed;/,
  "A catalog error should not remove still-usable seeded cards"
);
assert.match(
  pageSource,
  /canUseHomeSeed && isError[\s\S]*role="alert"[\s\S]*전체 목록을 불러오지 못했어요/,
  "A background catalog failure should remain visible and retryable"
);
assert.match(
  homeSlotSource,
  /router\.push\("\/product\/character-chat\?from=home"\)/,
  "The home more button should preserve its entry context"
);
assert.equal(
  pageSource.match(/nextSearchParams\.delete\("from"\)/g)?.length,
  4,
  "Changing or resetting a catalog filter should release the pinned home order"
);
assert.match(
  gridSource,
  /items\.map\(\(item, index\) =>[\s\S]*priority=\{index < priorityItemCount\}/,
  "The shared card grid should keep image priority explicitly bounded"
);
assert.match(
  pageSource,
  /useEffect\(\(\) => \{\s*setVisibleBatchCount\(1\);\s*\}, \[activeRole, activeScope, activeSort\]\)/,
  "Scope, role, and sort changes should reset the catalog to its first two rows"
);
assert.match(pageSource, /캐릭터 더 보기/);
assert.match(
  pageSource,
  /setVisibleBatchCount\(\s*\(currentCount\) => currentCount \+ 1\s*\)/,
  "Each more-button click should reveal one additional two-row batch"
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
assert.match(pageSource, /\{ label: "모든 캐릭터", value: "all" \}/);
assert.match(pageSource, /\{ label: "주인공", value: "main_protagonist" \}/);
assert.match(pageSource, /\{ label: "주요인물", value: "major_character" \}/);
assert.match(pageSource, /aria-pressed=\{activeScope === scope\.value\}/);
assert.match(pageSource, /ariaLabel="작품 범위 선택"/);
assert.match(pageSource, /ariaLabel="캐릭터 역할 선택"/);
assert.match(pageSource, /ariaLabel="정렬 방식 선택"/);
assert.ok(
  pageSource.indexOf('ariaLabel="캐릭터 역할 선택"') <
    pageSource.indexOf('ariaLabel="정렬 방식 선택"'),
  "The character-role filter should sit immediately before sorting"
);
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
  /searchParams\.get\("role"\)/,
  "The URL query should keep character role independent from scope and sort"
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
assert.match(pageSource, /필터 초기화/);
assert.doesNotMatch(
  pageSource,
  /LOCAL_MOCK|localMockEnabled|searchParams\.get\("mock"\)|window\.location\.hostname/,
  "Production catalog code should not ship a localhost mock path or fixture data"
);
assert.match(
  pageSource,
  /useGetCharacterChatCatalog\(\s*adultYn,\s*queryState\.enabled,\s*queryState\.productCacheIdentity\s*\)/,
  "The production catalog query should depend only on the authenticated query state"
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
  dtoSource.slice(homeDtoStart, catalogDtoStart),
  /characterRole: CharacterChatRole;[\s\S]*entryEpisodeNo\?: number;/,
  "Home and catalog cards should share one non-null normalized role contract"
);
assert.match(
  roleSource,
  /export type CharacterChatRole = "main_protagonist" \| "major_character";/
);
assert.match(
  dtoSource.slice(catalogDtoStart),
  /entryEpisodeNo: number;[\s\S]*hasCharacterImage: boolean;[\s\S]*createdDate: string;[\s\S]*chatQuality: "good" \| "normal";[\s\S]*fullReady: boolean;[\s\S]*readinessCoverageRatio: number;[\s\S]*distinctEpisodeCount: number;[\s\S]*exampleCount: number;[\s\S]*sceneCount: number;[\s\S]*lastViewedEpisodeNo: number \| null;[\s\S]*lastViewedAt: string \| null;/,
  "Catalog DTOs should expose a required entry episode, registration, asset completeness, and nullable reading progress"
);
assert.match(
  pageSource,
  /\{ label: "추천순", value: "recommended" \}/,
  "The catalog should expose the recommendation-order filter"
);
assert.match(
  readFileSync(new URL("./catalogFilter.ts", import.meta.url), "utf8"),
  /left\.cardOrder - right\.cardOrder/,
  "Recommended should consume the backend-owned recommendation rank"
);
assert.doesNotMatch(
  dtoSource.slice(homeDtoStart, catalogDtoStart),
  /fullReady|readinessCoverageRatio/,
  "Home character slot DTOs should not contain catalog-only recommendation readiness"
);
assert.match(gridSource, /<CharacterChatPreviewModal/);
assert.match(gridSource, /aspect-\[364\/414\]/);
assert.match(gridSource, /aria-haspopup="dialog"/);
assert.match(gridSource, /bottom-6pxr[\s\S]*left-6pxr/);
assert.match(gridSource, /bg-primary-100 text-white/);
assert.match(
  gridSource,
  /border-primary-100 bg-white\/90 text-primary-100/
);
assert.match(gridSource, /roleMeta\.gridLabel/);
assert.match(
  gridSource,
  /text-14pxr font-bold[^\"]*text-black-100/,
  "Character names should use an allowed emphasized font weight"
);
assert.doesNotMatch(gridSource, /font-semibold/);
assert.match(modalSource, /roleMeta\.modalLabel/);
assert.doesNotMatch(modalSource, /normalizedRoleLabel/);
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
  /readScopeStatus === "ready"/,
  "The real preview API should start after the read scope is ready"
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
assert.match(modalSource, /personalityCore/);
assert.match(modalSource, /speechStyle/);
assert.match(modalSource, /<select/);
assert.doesNotMatch(
  `${pageSource}\n${gridSource}\n${modalSource}`,
  /LOCAL_MOCK|localMockEnabled|mockReadEpisodeNo|previewDetail/,
  "Production catalog, grid, and modal code should not retain mock-only paths"
);
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
  /const showGrid = !showLoading && !showError && orderedItems\.length > 0;/,
  "Loading and error states must not leave stale cards interactive"
);

const catalogItems = [
  {
    characterSlotId: 30,
    productId: 130,
    characterRole: "major_character",
    cardOrder: 30,
    hasCharacterImage: false,
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
    productId: 112,
    characterRole: "major_character",
    cardOrder: 4,
    hasCharacterImage: false,
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
    productId: 111,
    characterRole: "main_protagonist",
    cardOrder: 1,
    hasCharacterImage: true,
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
    productId: 120,
    characterRole: "major_character",
    cardOrder: 2,
    hasCharacterImage: true,
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
    productId: 131,
    characterRole: "main_protagonist",
    cardOrder: 3,
    hasCharacterImage: false,
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
assert.equal(parseCharacterChatCatalogRole(null), "all");
assert.equal(parseCharacterChatCatalogRole("unknown"), "all");
assert.equal(parseCharacterChatCatalogRole("main_protagonist"), "main_protagonist");
assert.equal(parseCharacterChatCatalogRole("major_character"), "major_character");
assert.equal(parseCharacterChatCatalogSort(null), "recommended");
assert.equal(parseCharacterChatCatalogSort("unknown"), "recommended");
assert.equal(parseCharacterChatCatalogSort("latest"), "latest");
assert.deepEqual(getCharacterChatCatalogPaging(767), {
  columnCount: 2,
  batchSize: 4,
});
assert.deepEqual(getCharacterChatCatalogPaging(768), {
  columnCount: 4,
  batchSize: 8,
});
assert.deepEqual(getCharacterChatCatalogPaging(1023), {
  columnCount: 4,
  batchSize: 8,
});
assert.deepEqual(getCharacterChatCatalogPaging(1024), {
  columnCount: 5,
  batchSize: 10,
});
assert.deepEqual(getCharacterChatCatalogPaging(1279), {
  columnCount: 5,
  batchSize: 10,
});
assert.deepEqual(getCharacterChatCatalogPaging(1280), {
  columnCount: 6,
  batchSize: 12,
});
for (const viewportWidth of [375, 768, 1024, 1280]) {
  const { batchSize, columnCount } =
    getCharacterChatCatalogPaging(viewportWidth);
  const firstVisibleItemCount = batchSize;
  const secondVisibleItemCount = batchSize * 2;

  assert.equal(
    secondVisibleItemCount - firstVisibleItemCount,
    columnCount * 2,
    "Each batch should reveal exactly two more rows at the active breakpoint"
  );
}

const recommendedItems = filterCharacterChatCatalog(
  catalogItems,
  "all",
  "all",
  "recommended"
);
assert.deepEqual(
  recommendedItems.map((item) => item.characterSlotId),
  [11, 20, 31, 12, 30],
  "Recommended should preserve the backend-owned image, readiness, and protagonist rank"
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
    productId: characterSlotId,
    characterRole:
      characterSlotId === 1 ? "main_protagonist" : "major_character",
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
    "all",
    "recommended"
  ).map((item) => item.characterSlotId),
  [8, 7, 6, 5, 4, 3, 2, 1],
  "Recommended should follow the authoritative card order instead of rebuilding recommendation policy in the browser"
);
const episodeCountChangedItems = catalogItems.map((item, index) => ({
  ...item,
  syncedLatestEpisodeNo: index % 2 === 0 ? 0 : 10_000,
}));
assert.deepEqual(
  filterCharacterChatCatalog(
    episodeCountChangedItems,
    "all",
    "all",
    "recommended"
  ).map((item) => item.characterSlotId),
  recommendedItems.map((item) => item.characterSlotId),
  "Recommended order should be independent of synced episode counts"
);

const latestItems = filterCharacterChatCatalog(
  catalogItems,
  "all",
  "all",
  "latest"
);
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
  "all",
  "recommended"
);
assert.deepEqual(
  readingItems.map((item) => item.characterSlotId),
  [11, 20, 12],
  "Reading scope should retain the selected recommended sort"
);

const latestReadingItems = filterCharacterChatCatalog(
  catalogItems,
  "reading",
  "all",
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

assert.deepEqual(
  filterCharacterChatCatalog(
    catalogItems,
    "all",
    "main_protagonist",
    "recommended"
  ).map((item) => item.characterSlotId),
  [11, 31],
  "The role filter should independently retain protagonists"
);
assert.deepEqual(
  filterCharacterChatCatalog(
    catalogItems,
    "all",
    "major_character",
    "recommended"
  ).map((item) => item.characterSlotId),
  [20, 12, 30],
  "The role filter should independently retain major characters"
);

const sameQualityDifferentRoles = [
  {
    ...catalogItems[0],
    characterSlotId: 202,
    productId: 202,
    characterRole: "major_character" as const,
    fullReady: true,
    chatQuality: "good" as const,
  },
  {
    ...catalogItems[0],
    characterSlotId: 201,
    productId: 201,
    characterRole: "main_protagonist" as const,
    fullReady: true,
    chatQuality: "good" as const,
  },
];
assert.deepEqual(
  filterCharacterChatCatalog(
    sameQualityDifferentRoles,
    "all",
    "all",
    "recommended"
  ).map((item) => item.characterSlotId),
  [201, 202],
  "Role should break only otherwise-complete recommendation ties"
);

const adjacentProductItems = [
  {
    ...sameQualityDifferentRoles[0],
    characterSlotId: 301,
    productId: 300,
    cardOrder: 1,
  },
  {
    ...sameQualityDifferentRoles[0],
    characterSlotId: 302,
    productId: 300,
    cardOrder: 3,
  },
  {
    ...sameQualityDifferentRoles[0],
    characterSlotId: 303,
    productId: 301,
    cardOrder: 2,
  },
];
assert.deepEqual(
  filterCharacterChatCatalog(
    adjacentProductItems,
    "all",
    "all",
    "recommended"
  ).map((item) => item.productId),
  [300, 301, 300],
  "Recommended cards should preserve the backend-owned product spreading rank"
);

const pinnedHomeItems = pinHomeCharacterSlots(
  [
    {
      characterSlotId: 30,
      productId: 100,
      characterScopeKey: "main",
      label: "home-first",
    },
    {
      characterSlotId: 10,
      productId: 200,
      characterScopeKey: "main",
      label: "home-second",
    },
  ],
  [
    {
      characterSlotId: 999,
      productId: 100,
      characterScopeKey: "main",
      label: "same-character-different-id",
    },
    {
      characterSlotId: 30,
      productId: 100,
      characterScopeKey: "support",
      label: "same-product-different-character-same-id",
    },
    {
      characterSlotId: 40,
      productId: 400,
      characterScopeKey: "main",
      label: "catalog-new",
    },
  ]
);
assert.deepEqual(
  pinnedHomeItems.map((item) => [
    item.characterSlotId,
    item.productId,
    item.label,
  ]),
  [
    [30, 100, "home-first"],
    [10, 200, "home-second"],
    [30, 100, "same-product-different-character-same-id"],
    [40, 400, "catalog-new"],
  ],
  "Home cards should stay first while semantic duplicates are removed without dropping unrelated slot IDs"
);

assert.deepEqual(getCharacterChatRoleMeta("main_protagonist"), {
  gridLabel: "주인공",
  modalLabel: "메인 주인공",
  isProtagonist: true,
});
assert.deepEqual(getCharacterChatRoleMeta("major_character"), {
  gridLabel: "주요인물",
  modalLabel: "주요 인물",
  isProtagonist: false,
});

export type CharacterChatCatalogScope = "all" | "reading";
export type CharacterChatCatalogSort = "recommended" | "latest";

export const parseCharacterChatCatalogScope = (
  value: string | null
): CharacterChatCatalogScope => (value === "reading" ? "reading" : "all");

export const parseCharacterChatCatalogSort = (
  value: string | null
): CharacterChatCatalogSort => (value === "latest" ? "latest" : "recommended");

export const isPersonalizedCharacterChatCatalogScope = (
  scope: CharacterChatCatalogScope
) => scope === "reading";

export const resolveCharacterChatCatalogScope = (
  requestedScope: CharacterChatCatalogScope,
  canUsePersonalizedScope: boolean
): CharacterChatCatalogScope =>
  !isPersonalizedCharacterChatCatalogScope(requestedScope) ||
  canUsePersonalizedScope
    ? requestedScope
    : "all";

interface CharacterChatCatalogFilterItem {
  characterSlotId: number;
  createdDate: string;
  chatQuality: "good" | "normal";
  fullReady: boolean;
  readinessCoverageRatio: number;
  distinctEpisodeCount: number;
  exampleCount: number;
  sceneCount: number;
  lastViewedEpisodeNo: number | null;
}

const parseCreatedDate = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const sortRecommended = <T extends CharacterChatCatalogFilterItem>(
  items: T[]
) =>
  items.sort((left, right) => {
    if (left.fullReady !== right.fullReady) {
      return left.fullReady ? -1 : 1;
    }

    if (left.chatQuality !== right.chatQuality) {
      return left.chatQuality === "good" ? -1 : 1;
    }

    const coverageDifference =
      right.readinessCoverageRatio - left.readinessCoverageRatio;
    if (coverageDifference !== 0) return coverageDifference;

    const distinctEpisodeDifference =
      right.distinctEpisodeCount - left.distinctEpisodeCount;
    if (distinctEpisodeDifference !== 0) return distinctEpisodeDifference;

    const exampleDifference = right.exampleCount - left.exampleCount;
    if (exampleDifference !== 0) return exampleDifference;

    const sceneDifference = right.sceneCount - left.sceneCount;
    if (sceneDifference !== 0) return sceneDifference;

    return left.characterSlotId - right.characterSlotId;
  });

const sortLatest = <T extends CharacterChatCatalogFilterItem>(items: T[]) =>
  items.sort((left, right) => {
    const createdDateDifference =
      parseCreatedDate(right.createdDate) - parseCreatedDate(left.createdDate);
    if (createdDateDifference !== 0) return createdDateDifference;

    return right.characterSlotId - left.characterSlotId;
  });

export const filterCharacterChatCatalog = <
  T extends CharacterChatCatalogFilterItem,
>(
  items: readonly T[],
  scope: CharacterChatCatalogScope,
  sort: CharacterChatCatalogSort
): T[] => {
  const scopedItems =
    scope === "reading"
      ? items.filter((item) => item.lastViewedEpisodeNo !== null)
      : [...items];

  return sort === "latest"
    ? sortLatest(scopedItems)
    : sortRecommended(scopedItems);
};

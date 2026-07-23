export type CharacterChatCatalogFilter =
  | "recommended"
  | "all"
  | "reading"
  | "unread";

export const parseCharacterChatCatalogFilter = (
  value: string | null
): CharacterChatCatalogFilter =>
  value === "all" || value === "reading" || value === "unread"
    ? value
    : "recommended";

export const isPersonalizedCharacterChatCatalogFilter = (
  filter: CharacterChatCatalogFilter
) => filter === "reading" || filter === "unread";

export const resolveCharacterChatCatalogFilter = (
  requestedFilter: CharacterChatCatalogFilter,
  canUsePersonalizedFilters: boolean
): CharacterChatCatalogFilter =>
  !isPersonalizedCharacterChatCatalogFilter(requestedFilter) ||
  canUsePersonalizedFilters
    ? requestedFilter
    : "recommended";

interface CharacterChatCatalogFilterItem {
  characterSlotId: number;
  cardOrder: number;
  fullReady: boolean;
  readinessCoverageRatio: number;
  lastViewedEpisodeNo: number | null;
  lastViewedAt: string | null;
}

const hasReadingProgress = (item: CharacterChatCatalogFilterItem) =>
  item.lastViewedEpisodeNo !== null;

const parseLastViewedAt = (value: string | null) => {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

export const filterCharacterChatCatalog = <
  T extends CharacterChatCatalogFilterItem,
>(
  items: readonly T[],
  filter: CharacterChatCatalogFilter
): T[] => {
  if (filter === "all") return [...items];

  if (filter === "recommended") {
    return [...items].sort((left, right) => {
      if (left.fullReady !== right.fullReady) {
        return left.fullReady ? -1 : 1;
      }

      const coverageDifference =
        right.readinessCoverageRatio - left.readinessCoverageRatio;
      if (coverageDifference !== 0) return coverageDifference;

      const cardOrderDifference = left.cardOrder - right.cardOrder;
      if (cardOrderDifference !== 0) return cardOrderDifference;

      return left.characterSlotId - right.characterSlotId;
    });
  }

  const filteredItems = items.filter((item) =>
    filter === "reading"
      ? hasReadingProgress(item)
      : !hasReadingProgress(item)
  );

  if (filter === "unread") return filteredItems;

  return filteredItems.sort((left, right) => {
    const viewedAtDifference =
      parseLastViewedAt(right.lastViewedAt) -
      parseLastViewedAt(left.lastViewedAt);
    if (viewedAtDifference !== 0) return viewedAtDifference;

    const cardOrderDifference = left.cardOrder - right.cardOrder;
    if (cardOrderDifference !== 0) return cardOrderDifference;

    return left.characterSlotId - right.characterSlotId;
  });
};

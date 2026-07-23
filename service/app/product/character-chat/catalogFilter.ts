export type CharacterChatCatalogFilter = "all" | "reading" | "unread";

export const parseCharacterChatCatalogFilter = (
  value: string | null
): CharacterChatCatalogFilter =>
  value === "reading" || value === "unread" ? value : "all";

export const resolveCharacterChatCatalogFilter = (
  requestedFilter: CharacterChatCatalogFilter,
  canUsePersonalizedFilters: boolean
): CharacterChatCatalogFilter =>
  requestedFilter === "all" || canUsePersonalizedFilters
    ? requestedFilter
    : "all";

interface CharacterChatCatalogFilterItem {
  characterSlotId: number;
  cardOrder: number;
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

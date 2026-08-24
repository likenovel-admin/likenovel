import type { CharacterChatRole } from "@/utils/characterChatRole";

export type CharacterChatCatalogScope = "all" | "reading";
export type CharacterChatCatalogRole = "all" | CharacterChatRole;
export type CharacterChatCatalogSort = "recommended" | "latest";

export const getCharacterChatCatalogPaging = (viewportWidth: number) => {
  const columnCount =
    viewportWidth >= 1280
      ? 6
      : viewportWidth >= 1024
        ? 5
        : viewportWidth >= 768
          ? 4
          : 2;
  const batchSize = columnCount * 2;

  return {
    columnCount,
    batchSize,
  };
};

export const parseCharacterChatCatalogScope = (
  value: string | null
): CharacterChatCatalogScope => (value === "reading" ? "reading" : "all");

export const parseCharacterChatCatalogRole = (
  value: string | null
): CharacterChatCatalogRole =>
  value === "main_protagonist" || value === "major_character" ? value : "all";

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
  cardOrder: number;
  characterRole: CharacterChatRole;
  createdDate: string;
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
    const recommendationDifference = left.cardOrder - right.cardOrder;
    if (recommendationDifference !== 0) return recommendationDifference;
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
  role: CharacterChatCatalogRole,
  sort: CharacterChatCatalogSort
): T[] => {
  const scopedItems =
    scope === "reading"
      ? items.filter((item) => item.lastViewedEpisodeNo !== null)
      : [...items];
  const roleItems =
    role === "all"
      ? scopedItems
      : scopedItems.filter((item) => item.characterRole === role);

  return sort === "latest"
    ? sortLatest(roleItems)
    : sortRecommended(roleItems);
};

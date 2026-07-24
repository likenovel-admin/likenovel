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
  productId: number;
  characterRole: CharacterChatRole;
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

const spreadAdjacentProducts = <T extends CharacterChatCatalogFilterItem>(
  items: T[]
) => {
  for (let index = 1; index < items.length; index += 1) {
    const previousItem = items[index - 1];
    const currentItem = items[index];
    if (previousItem.productId !== currentItem.productId) continue;

    let swapIndex = -1;
    for (
      let candidateIndex = index + 1;
      candidateIndex < items.length;
      candidateIndex += 1
    ) {
      const candidate = items[candidateIndex];
      if (
        candidate.productId !== previousItem.productId &&
        candidate.fullReady === currentItem.fullReady &&
        candidate.chatQuality === currentItem.chatQuality
      ) {
        swapIndex = candidateIndex;
        break;
      }
    }
    if (swapIndex === -1) continue;

    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
};

const sortRecommended = <T extends CharacterChatCatalogFilterItem>(
  items: T[]
) => {
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

    if (left.characterRole !== right.characterRole) {
      return left.characterRole === "main_protagonist" ? -1 : 1;
    }

    return left.characterSlotId - right.characterSlotId;
  });

  return spreadAdjacentProducts(items);
};

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

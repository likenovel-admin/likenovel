export const BANNER_CAROUSEL_DESKTOP_PAGE_SIZE = 3;
export const BANNER_CAROUSEL_CARD_WIDTH = 364;
export const BANNER_CAROUSEL_CARD_HEIGHT = 414;
export const BANNER_CAROUSEL_CARD_GAP = 9;

export function getBannerCarouselVisibleCount(
  availableWidth: number,
  panelCount: number,
): number {
  if (panelCount <= 0) return 0;

  const visibleCount = Math.floor(
    (availableWidth + BANNER_CAROUSEL_CARD_GAP) /
      (BANNER_CAROUSEL_CARD_WIDTH + BANNER_CAROUSEL_CARD_GAP),
  );

  return Math.max(
    1,
    Math.min(BANNER_CAROUSEL_DESKTOP_PAGE_SIZE, panelCount, visibleCount),
  );
}

export function getBannerCarouselViewportWidth(visibleCount: number): number {
  if (visibleCount <= 0) return 0;

  return (
    visibleCount * BANNER_CAROUSEL_CARD_WIDTH +
    (visibleCount - 1) * BANNER_CAROUSEL_CARD_GAP
  );
}

export function getBannerCarouselPageCount(
  panelCount: number,
  visibleCount = BANNER_CAROUSEL_DESKTOP_PAGE_SIZE,
): number {
  if (panelCount <= 0 || visibleCount <= 0) return 0;

  return Math.ceil(panelCount / visibleCount);
}

export function getBannerCarouselPageStartIndex(
  pageIndex: number,
  panelCount: number,
  visibleCount = BANNER_CAROUSEL_DESKTOP_PAGE_SIZE,
): number {
  if (panelCount <= 0 || visibleCount <= 0) return 0;

  return Math.min(
    pageIndex * visibleCount,
    Math.max(panelCount - visibleCount, 0),
  );
}

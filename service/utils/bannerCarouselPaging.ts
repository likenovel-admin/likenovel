export const BANNER_CAROUSEL_DESKTOP_PAGE_SIZE = 3;
export const BANNER_CAROUSEL_CARD_WIDTH = 364;
export const BANNER_CAROUSEL_CARD_HEIGHT = 414;
export const BANNER_CAROUSEL_CARD_GAP = 9;
export const BANNER_CAROUSEL_MOBILE_BREAKPOINT = 768;
export const BANNER_CAROUSEL_MOBILE_SIDE_PEEK = 24;
export const BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS = 7000;
export const BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS = 4000;

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

export function getBannerCarouselMobileCardWidth(availableWidth: number): number {
  if (availableWidth <= 0) return 0;

  return Math.max(0, availableWidth - BANNER_CAROUSEL_MOBILE_SIDE_PEEK * 2);
}

export function getBannerCarouselMobileCardHeight(cardWidth: number): number {
  if (cardWidth <= 0) return 0;

  return Math.round(
    (cardWidth * BANNER_CAROUSEL_CARD_HEIGHT) / BANNER_CAROUSEL_CARD_WIDTH,
  );
}

export function getBannerCarouselMobileTrackPanelIndexes(
  panelCount: number,
): number[] {
  if (panelCount <= 0) return [];
  if (panelCount === 1) return [0];

  return [
    panelCount - 1,
    ...Array.from({ length: panelCount }, (_, index) => index),
    0,
  ];
}

export function getBannerCarouselMobileTranslateX(
  pageIndex: number,
  cardWidth: number,
): number {
  if (cardWidth <= 0) return 0;

  return (
    BANNER_CAROUSEL_MOBILE_SIDE_PEEK -
    (pageIndex + 1) * (cardWidth + BANNER_CAROUSEL_CARD_GAP)
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

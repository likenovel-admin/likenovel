export const BANNER_CAROUSEL_DESKTOP_PAGE_SIZE = 3;
export const BANNER_CAROUSEL_MOBILE_MIN_CENTER_PADDING = 32;
export const BANNER_CAROUSEL_MOBILE_MAX_CENTER_PADDING = 330;
export const BANNER_CAROUSEL_CARD_WIDTH = 364;

export function getBannerCarouselPageSize(panelCount: number): number {
  return BANNER_CAROUSEL_DESKTOP_PAGE_SIZE;
}

export function getBannerCarouselPageCount(panelCount: number): number {
  if (panelCount <= 0) return 0;

  return Math.ceil(
    panelCount / getBannerCarouselPageSize(panelCount),
  );
}

export function getBannerCarouselPageStartIndex(pageIndex: number): number {
  return pageIndex * BANNER_CAROUSEL_DESKTOP_PAGE_SIZE;
}

export function getBannerCarouselActivePage(slideIndex: number, panelCount: number): number {
  const pageSize = getBannerCarouselPageSize(panelCount);

  return Math.floor(slideIndex / pageSize);
}

export function getBannerCarouselMobileCenterPadding(viewportWidth: number): number {
  const centeredPadding = Math.round(
    (viewportWidth - BANNER_CAROUSEL_CARD_WIDTH) / 2,
  );

  return Math.min(
    BANNER_CAROUSEL_MOBILE_MAX_CENTER_PADDING,
    Math.max(BANNER_CAROUSEL_MOBILE_MIN_CENTER_PADDING, centeredPadding),
  );
}

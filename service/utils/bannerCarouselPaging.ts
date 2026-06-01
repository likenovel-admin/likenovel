export const BANNER_CAROUSEL_DESKTOP_PAGE_SIZE = 3;

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

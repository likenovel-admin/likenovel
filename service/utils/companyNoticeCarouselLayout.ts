export const COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH = 1120;
export const COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE = 3;
export const COMPANY_NOTICE_CAROUSEL_CARD_GAP = 10;
export const COMPANY_NOTICE_CAROUSEL_ASPECT_RATIO = 2;
export const COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT = 768;
export const COMPANY_NOTICE_CAROUSEL_AUTO_ROTATE_INTERVAL_MS = 6000;

export function getCompanyNoticeCarouselVisibleCount(
  availableWidth: number,
  itemCount: number,
): number {
  if (itemCount <= 0 || availableWidth <= 0) return 0;

  if (availableWidth < COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT) {
    return 1;
  }

  return Math.min(COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE, itemCount);
}

export function getCompanyNoticeCarouselViewportWidth(
  visibleCount: number,
): number {
  if (visibleCount <= 0) return 0;

  const desktopCardWidth =
    (COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH -
      COMPANY_NOTICE_CAROUSEL_CARD_GAP *
        (COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE - 1)) /
    COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE;

  return (
    visibleCount * desktopCardWidth +
    (visibleCount - 1) * COMPANY_NOTICE_CAROUSEL_CARD_GAP
  );
}

export function getCompanyNoticeCarouselCardMetrics(
  availableWidth: number,
  visibleCount: number,
): { width: number; height: number } {
  if (availableWidth <= 0 || visibleCount <= 0) {
    return { width: 0, height: 0 };
  }

  const width =
    visibleCount === 1 &&
    availableWidth >= COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT
      ? getCompanyNoticeCarouselViewportWidth(1)
      : (availableWidth -
          (visibleCount - 1) * COMPANY_NOTICE_CAROUSEL_CARD_GAP) /
        visibleCount;

  return {
    width,
    height: width / COMPANY_NOTICE_CAROUSEL_ASPECT_RATIO,
  };
}

export function getCompanyNoticeCarouselPageCount(
  itemCount: number,
  visibleCount: number,
): number {
  if (itemCount <= 0 || visibleCount <= 0) return 0;

  return Math.ceil(itemCount / visibleCount);
}

export function getCompanyNoticeCarouselPageStartIndex(
  pageIndex: number,
  itemCount: number,
  visibleCount: number,
): number {
  if (itemCount <= 0 || visibleCount <= 0) return 0;

  return Math.min(pageIndex * visibleCount, Math.max(itemCount - 1, 0));
}

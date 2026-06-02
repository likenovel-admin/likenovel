import { normalizeUrl } from "@/utils/common";
import {
  BANNER_CAROUSEL_CARD_GAP,
  BANNER_CAROUSEL_CARD_HEIGHT,
  BANNER_CAROUSEL_CARD_WIDTH,
  BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS,
  BANNER_CAROUSEL_MOBILE_BREAKPOINT,
  BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS,
  getBannerCarouselMobileCardHeight,
  getBannerCarouselMobileCardWidth,
  getBannerCarouselMobileTrackPanelIndexes,
  getBannerCarouselMobileTranslateX,
  getBannerCarouselPageCount,
  getBannerCarouselPageStartIndex,
  getBannerCarouselViewportWidth,
  getBannerCarouselVisibleCount,
} from "@/utils/bannerCarouselPaging";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import ArrowLeftMedium from "/public/images/arrow-left-medium.svg";
import ArrowRightMedium from "/public/images/arrow-right-medium.svg";

export interface PrimaryPanel {
  pcImgPath: string;
  mobileImgPath: string;
  textType?: "char" | "img";
  topText?: string;
  middleText?: string;
  bottomText?: string;
  textPosition?: "leftTop" | "leftBottom";
  textImgPath?: string;
  mobileTextImgPath?: string;
  overlayYn?: "Y" | "N";
  overlayType?: "gradation" | "img";
  overlayImgPath?: string;
  mobileOverlayImgPath?: string;
  linkPath: string;
}

interface Props {
  primaryPanels: PrimaryPanel[];
}

const DEFAULT_AVAILABLE_WIDTH = getBannerCarouselViewportWidth(3);

const Carousel = ({ primaryPanels }: Props) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [availableWidth, setAvailableWidth] = useState(DEFAULT_AVAILABLE_WIDTH);
  const viewportMeasureRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  const count = primaryPanels.length;
  const visibleCount = getBannerCarouselVisibleCount(availableWidth, count);
  const isMobile = availableWidth < BANNER_CAROUSEL_MOBILE_BREAKPOINT;
  const pageCount = isMobile
    ? count
    : getBannerCarouselPageCount(count, visibleCount);
  const canSlide = pageCount > 1;
  const desktopViewportWidth = getBannerCarouselViewportWidth(visibleCount);
  const mobileCardWidth = getBannerCarouselMobileCardWidth(availableWidth);
  const mobileCardHeight = getBannerCarouselMobileCardHeight(mobileCardWidth);
  const viewportWidth = isMobile ? availableWidth : desktopViewportWidth;
  const mobileTrackPanelIndexes =
    getBannerCarouselMobileTrackPanelIndexes(count);
  const renderedPanels = isMobile
    ? mobileTrackPanelIndexes.map((panelIndex, renderIndex) => ({
        panel: primaryPanels[panelIndex],
        panelIndex,
        renderIndex,
      }))
    : primaryPanels.map((panel, panelIndex) => ({
        panel,
        panelIndex,
        renderIndex: panelIndex,
      }));
  const startIndex = getBannerCarouselPageStartIndex(
    currentPage,
    count,
    visibleCount,
  );
  const desktopTranslateX =
    startIndex * (BANNER_CAROUSEL_CARD_WIDTH + BANNER_CAROUSEL_CARD_GAP);
  const mobileTranslateX = getBannerCarouselMobileTranslateX(
    currentPage,
    mobileCardWidth,
  );
  const translateX = isMobile ? mobileTranslateX : desktopTranslateX;
  const cardWidth = isMobile ? mobileCardWidth : BANNER_CAROUSEL_CARD_WIDTH;
  const cardHeight = isMobile ? mobileCardHeight : BANNER_CAROUSEL_CARD_HEIGHT;
  const autoRotateIntervalMs = isMobile
    ? BANNER_CAROUSEL_MOBILE_AUTO_ROTATE_INTERVAL_MS
    : BANNER_CAROUSEL_DESKTOP_AUTO_ROTATE_INTERVAL_MS;

  useEffect(() => {
    const target = viewportMeasureRef.current;
    if (!target) return;

    const updateAvailableWidth = () => {
      setAvailableWidth(target.getBoundingClientRect().width);
    };

    updateAvailableWidth();

    const resizeObserver = new ResizeObserver(updateAvailableWidth);
    resizeObserver.observe(target);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  useEffect(() => {
    if (!canSlide) return;

    const timer = window.setInterval(() => {
      setCurrentPage((page) => (page + 1) % pageCount);
    }, autoRotateIntervalMs);

    return () => window.clearInterval(timer);
  }, [autoRotateIntervalMs, canSlide, pageCount]);

  if (count === 0) return null;

  const goToPreviousPage = () => {
    if (!canSlide) return;
    setCurrentPage((page) => (page - 1 + pageCount) % pageCount);
  };

  const goToNextPage = () => {
    if (!canSlide) return;
    setCurrentPage((page) => (page + 1) % pageCount);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    dragStartX.current = e.clientX;
    dragCurrentX.current = e.clientX;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    dragCurrentX.current = e.clientX;
    if (Math.abs(e.clientX - dragStartX.current) > 5) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;

    const deltaX = dragCurrentX.current - dragStartX.current;
    if (Math.abs(deltaX) < 50) return;

    if (deltaX < 0) {
      goToNextPage();
      return;
    }

    goToPreviousPage();
  };

  return (
    <div className="w-full">
      <div ref={viewportMeasureRef} className="w-full flex justify-center">
        <div
          className="banner-carousel relative max-w-full"
          style={{ width: viewportWidth }}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                gap: BANNER_CAROUSEL_CARD_GAP,
                transform: `translateX(${
                  isMobile ? translateX : -translateX
                }px)`,
              }}
            >
              {renderedPanels.map(({ panel, panelIndex, renderIndex }) => (
                <div
                  key={`${panelIndex}-${renderIndex}`}
                  className="shrink-0 cursor-pointer"
                  style={{ width: cardWidth, touchAction: "pan-y" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    isDragging.current = false;
                  }}
                  onClick={() => {
                    if (isDragging.current) return;
                    if (panel.linkPath) {
                      window.open(normalizeUrl(panel.linkPath), "_blank");
                    }
                  }}
                >
                  <img
                    src={panel.pcImgPath}
                    alt={`banner_${panelIndex}`}
                    className="object-cover rounded-[20px]"
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {canSlide && (
            <>
              <button
                type="button"
                aria-label="이전 배너"
                onClick={goToPreviousPage}
                className="hidden md:flex absolute top-1/2 left-[-20px] -translate-y-1/2 z-50 w-[40px] h-[40px] items-center justify-center rounded-full bg-white border border-[#F0F0F0] shadow-[2px_4px_8px_0_rgba(0,0,0,0.06)]"
              >
                <ArrowLeftMedium className="w-[9px] h-[16px] text-[#333333]" />
              </button>
              <button
                type="button"
                aria-label="다음 배너"
                onClick={goToNextPage}
                className="hidden md:flex absolute top-1/2 right-[-20px] -translate-y-1/2 z-50 w-[40px] h-[40px] items-center justify-center rounded-full bg-white border border-[#F0F0F0] shadow-[2px_4px_8px_0_rgba(0,0,0,0.06)]"
              >
                <ArrowRightMedium className="w-[9px] h-[16px] text-[#333333]" />
              </button>
            </>
          )}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="relative flex justify-center gap-[8px] items-center py-[10px]">
          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() => setCurrentPage(pageIndex)}
              className="flex items-center cursor-pointer p-[4px]"
            >
              <span
                className={`block h-[6px] rounded-full transition-all ${
                  currentPage === pageIndex
                    ? "w-[28px] bg-[#0255d9]"
                    : "w-[10px] bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

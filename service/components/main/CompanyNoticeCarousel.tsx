"use client";

import { normalizeUrl } from "@/utils/common";
import {
  COMPANY_NOTICE_CAROUSEL_AUTO_ROTATE_INTERVAL_MS,
  COMPANY_NOTICE_CAROUSEL_CARD_GAP,
  COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
  COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT,
  getCompanyNoticeCarouselCardMetrics,
  getCompanyNoticeCarouselPageCount,
  getCompanyNoticeCarouselPageStartIndex,
  getCompanyNoticeCarouselViewportWidth,
  getCompanyNoticeCarouselVisibleCount,
} from "@/utils/companyNoticeCarouselLayout";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import ArrowLeftMedium from "/public/images/arrow-left-medium.svg";
import ArrowRightMedium from "/public/images/arrow-right-medium.svg";

export interface CompanyNoticeItem {
  id: number;
  imageSrc: string;
  linkPath: string;
}

interface Props {
  items?: CompanyNoticeItem[];
}

const NOTICE_IMAGE_BLUE =
  "/images/company-notice-membership.svg";
const NOTICE_IMAGE_GREEN =
  "/images/company-notice-settlement.svg";
const NOTICE_IMAGE_RED =
  "/images/company-notice-upgrade.svg";
const NOTICE_IMAGE_GOLD =
  "/images/company-notice-support.svg";

export const COMPANY_NOTICE_MOCK_ITEMS: CompanyNoticeItem[] = [
  {
    id: 1,
    imageSrc: NOTICE_IMAGE_BLUE,
    linkPath: "/product/customer-service/notice",
  },
  {
    id: 2,
    imageSrc: NOTICE_IMAGE_GREEN,
    linkPath: "/product/customer-service/notice",
  },
  {
    id: 3,
    imageSrc: NOTICE_IMAGE_RED,
    linkPath: "/product/customer-service/notice",
  },
  {
    id: 4,
    imageSrc: NOTICE_IMAGE_GOLD,
    linkPath: "/product/customer-service/notice",
  },
];

const CompanyNoticeCarousel = ({
  items = COMPANY_NOTICE_MOCK_ITEMS,
}: Props) => {
  const [availableWidth, setAvailableWidth] = useState(
    COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
  );
  const [currentPage, setCurrentPage] = useState(0);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  const count = items.length;
  const isMobile = availableWidth < COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT;
  const visibleCount = getCompanyNoticeCarouselVisibleCount(
    availableWidth,
    count,
  );
  const pageCount = getCompanyNoticeCarouselPageCount(count, visibleCount);
  const canSlide = pageCount > 1;
  const viewportWidth = isMobile
    ? availableWidth
    : Math.min(
        availableWidth,
        getCompanyNoticeCarouselViewportWidth(visibleCount),
      );
  const { width: cardWidth } = getCompanyNoticeCarouselCardMetrics(
    viewportWidth,
    visibleCount,
  );
  const startIndex = getCompanyNoticeCarouselPageStartIndex(
    currentPage,
    count,
    visibleCount,
  );
  const translateX =
    startIndex * (cardWidth + COMPANY_NOTICE_CAROUSEL_CARD_GAP);

  useEffect(() => {
    const target = measureRef.current;
    if (!target) return;

    const updateAvailableWidth = () => {
      setAvailableWidth(
        Math.min(
          target.getBoundingClientRect().width,
          COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
        ),
      );
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
    }, COMPANY_NOTICE_CAROUSEL_AUTO_ROTATE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [canSlide, pageCount]);

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
    <section
      className="w-full mt-30pxr md:mt-70pxr px-20pxr md:px-0"
      aria-label="회사 공지"
    >
      <div
        ref={measureRef}
        className="relative mx-auto w-full max-w-[1120px]"
      >
        <div className="relative max-w-full" style={{ width: viewportWidth }}>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                gap: COMPANY_NOTICE_CAROUSEL_CARD_GAP,
                transform: `translateX(-${translateX}px)`,
              }}
            >
              {items.map((item) => (
                <article
                  key={item.id}
                  className="relative shrink-0 overflow-hidden rounded-[8px] bg-[#171719]"
                  style={{
                    width: cardWidth,
                    aspectRatio: "2 / 1",
                    touchAction: "pan-y",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    isDragging.current = false;
                  }}
                >
                  <a
                    href={normalizeUrl(item.linkPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block h-full w-full cursor-pointer"
                    onClick={(event) => {
                      if (isDragging.current) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 100vw, 367px"
                      className="absolute inset-0 h-full w-full object-cover"
                      aria-hidden="true"
                    />
                  </a>
                </article>
              ))}
            </div>
          </div>

          {canSlide && (
            <>
              <button
                type="button"
                aria-label="이전 회사 공지"
                onClick={goToPreviousPage}
                className="hidden md:flex absolute top-1/2 left-[-20px] z-20 h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full border border-[#F0F0F0] bg-white shadow-[2px_4px_8px_0_rgba(0,0,0,0.08)]"
              >
                <ArrowLeftMedium className="h-[16px] w-[9px] text-[#333333]" />
              </button>
              <button
                type="button"
                aria-label="다음 회사 공지"
                onClick={goToNextPage}
                className="hidden md:flex absolute top-1/2 right-[-20px] z-20 h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full border border-[#F0F0F0] bg-white shadow-[2px_4px_8px_0_rgba(0,0,0,0.08)]"
              >
                <ArrowRightMedium className="h-[16px] w-[9px] text-[#333333]" />
              </button>
            </>
          )}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-[8px] py-[12px]">
          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              aria-label={`${pageIndex + 1}번째 회사 공지 페이지`}
              onClick={() => setCurrentPage(pageIndex)}
              className="flex cursor-pointer items-center p-[4px]"
            >
              <span
                className={`block h-[6px] rounded-full transition-all ${
                  currentPage === pageIndex
                    ? "w-[28px] bg-[#0255D9]"
                    : "w-[10px] bg-[#D6D9E0]"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default CompanyNoticeCarousel;

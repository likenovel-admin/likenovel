"use client";

import { normalizeUrl } from "@/utils/common";
import {
  COMPANY_NOTICE_CAROUSEL_AUTO_ROTATE_INTERVAL_MS,
  COMPANY_NOTICE_CAROUSEL_CARD_GAP,
  COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
  COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE,
  COMPANY_NOTICE_CAROUSEL_MOBILE_BREAKPOINT,
  getCompanyNoticeCarouselCardMetrics,
  getCompanyNoticeCarouselLoopBuffer,
  getCompanyNoticeCarouselPageCount,
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
  ariaLabel: string;
}

interface Props {
  items?: CompanyNoticeItem[];
}

export const COMPANY_NOTICE_ITEMS: CompanyNoticeItem[] = [
  {
    id: 1,
    imageSrc: "https://cdn.likenovel.net/user/L6HeQiMCSziLoNswCiCTaQ.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/5",
    ariaLabel: "연재 및 유료화 정책 안내 공지",
  },
  {
    id: 2,
    imageSrc: "https://cdn.likenovel.net/user/8tgpcio9TbuweVtilwaXUQ.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/36",
    ariaLabel: "AI 사서 미리보기 오픈 공지",
  },
  {
    id: 3,
    imageSrc: "https://cdn.likenovel.net/user/vsJV-rkOQWK5P1rgqoNSoQ.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/40",
    ariaLabel: "일반연재 승급 자동화 공지",
  },
  {
    id: 43,
    imageSrc: "/images/company-notice-ai-consent.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/43",
    ariaLabel: "홍보 콘텐츠 게재 동의 안내 공지",
  },
  {
    id: 4,
    imageSrc: "https://cdn.likenovel.net/user/qdCb-kRCQ9yGD4aTrJfCAg.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/38",
    ariaLabel: "작품 분석 기능 강화 공지",
  },
  {
    id: 5,
    imageSrc: "https://cdn.likenovel.net/user/uBydaISGQb-BrxRDCQUQww.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/32",
    ariaLabel: "웹소챗 미리보기 오픈 공지",
  },
  {
    id: 6,
    imageSrc: "https://cdn.likenovel.net/user/WVhvGyWPSFK_5Dl1rF29GQ.webp",
    linkPath: "https://www.likenovel.net/product/customer-service/notice/6",
    ariaLabel: "서비스 개편 안내 공지",
  },
];

const CompanyNoticeCarousel = ({
  items = COMPANY_NOTICE_ITEMS,
}: Props) => {
  const [availableWidth, setAvailableWidth] = useState(
    COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH,
  );
  const [trackIndex, setTrackIndex] = useState(() =>
    items.length > COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE
      ? COMPANY_NOTICE_CAROUSEL_DESKTOP_PAGE_SIZE
      : 0,
  );
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [autoRotateResetKey, setAutoRotateResetKey] = useState(0);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const restoreTransitionFrame = useRef<number | null>(null);

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
  const loopBuffer = getCompanyNoticeCarouselLoopBuffer(count, visibleCount);
  const currentPage =
    canSlide && count > 0
      ? ((trackIndex - loopBuffer) % count + count) % count
      : 0;
  const renderedItems = canSlide
    ? [
        ...items.slice(-loopBuffer).map((item, index) => ({
          item,
          renderKey: `head-${index}-${item.id}`,
        })),
        ...items.map((item, index) => ({
          item,
          renderKey: `item-${index}-${item.id}`,
        })),
        ...items.slice(0, loopBuffer).map((item, index) => ({
          item,
          renderKey: `tail-${index}-${item.id}`,
        })),
      ]
    : items.map((item, index) => ({
        item,
        renderKey: `item-${index}-${item.id}`,
      }));
  const translateX =
    trackIndex * (cardWidth + COMPANY_NOTICE_CAROUSEL_CARD_GAP);

  const restoreTransitionOnNextFrame = () => {
    if (restoreTransitionFrame.current !== null) {
      window.cancelAnimationFrame(restoreTransitionFrame.current);
    }

    restoreTransitionFrame.current = window.requestAnimationFrame(() => {
      restoreTransitionFrame.current = window.requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
        restoreTransitionFrame.current = null;
      });
    });
  };

  const goToTrackIndex = (nextTrackIndex: number) => {
    if (!canSlide) return;

    setIsTransitionEnabled(true);
    setTrackIndex(nextTrackIndex);
    setAutoRotateResetKey((key) => key + 1);
  };

  const handleTrackTransitionEnd = () => {
    if (!canSlide) return;

    if (trackIndex >= loopBuffer + count) {
      setIsTransitionEnabled(false);
      setTrackIndex(loopBuffer + currentPage);
      restoreTransitionOnNextFrame();
      return;
    }

    if (trackIndex < loopBuffer) {
      setIsTransitionEnabled(false);
      setTrackIndex(loopBuffer + currentPage);
      restoreTransitionOnNextFrame();
    }
  };

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
    if (restoreTransitionFrame.current !== null) {
      window.cancelAnimationFrame(restoreTransitionFrame.current);
      restoreTransitionFrame.current = null;
    }

    setIsTransitionEnabled(false);
    setTrackIndex(loopBuffer);

    restoreTransitionFrame.current = window.requestAnimationFrame(() => {
      restoreTransitionFrame.current = window.requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
        restoreTransitionFrame.current = null;
      });
    });
  }, [count, loopBuffer]);

  useEffect(() => {
    return () => {
      if (restoreTransitionFrame.current !== null) {
        window.cancelAnimationFrame(restoreTransitionFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canSlide) return;

    const timer = window.setInterval(() => {
      setIsTransitionEnabled(true);
      setTrackIndex((index) => index + 1);
    }, COMPANY_NOTICE_CAROUSEL_AUTO_ROTATE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [canSlide, autoRotateResetKey]);

  if (count === 0) return null;

  const goToPreviousPage = () => {
    if (!canSlide) return;
    setIsTransitionEnabled(true);
    setTrackIndex((index) => index - 1);
    setAutoRotateResetKey((key) => key + 1);
  };

  const goToNextPage = () => {
    if (!canSlide) return;
    setIsTransitionEnabled(true);
    setTrackIndex((index) => index + 1);
    setAutoRotateResetKey((key) => key + 1);
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
              className={`flex ${
                isTransitionEnabled
                  ? "transition-transform duration-300 ease-out"
                  : ""
              }`}
              style={{
                gap: COMPANY_NOTICE_CAROUSEL_CARD_GAP,
                transform: `translateX(-${translateX}px)`,
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {renderedItems.map(({ item, renderKey }, renderIndex) => {
                const isVisibleCard =
                  renderIndex >= trackIndex &&
                  renderIndex < trackIndex + visibleCount;

                return (
                  <article
                    key={renderKey}
                    aria-hidden={!isVisibleCard}
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
                      aria-label={item.ariaLabel}
                      tabIndex={isVisibleCard ? undefined : -1}
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
                );
              })}
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
              onClick={() => goToTrackIndex(loopBuffer + pageIndex)}
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

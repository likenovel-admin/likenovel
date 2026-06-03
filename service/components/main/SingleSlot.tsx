"use client";

import { IMainSingleSlotItem } from "@/app/api/query/product/dto";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import { buildProductDetailPath } from "@/utils/productPath";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import SquareBadge from "../common/SquareBadge";

interface Props {
  slot: IMainSingleSlotItem;
}

const SINGLE_SLOT_TITLE_MARQUEE_GAP = 48;
const SINGLE_SLOT_TITLE_MIN_DURATION_SEC = 8;
const SINGLE_SLOT_TITLE_MAX_DURATION_SEC = 18;
const SINGLE_SLOT_TITLE_PIXELS_PER_SEC = 28;

const getSingleSlotTitleDuration = (distance: number) => {
  return Math.min(
    Math.max(
      distance / SINGLE_SLOT_TITLE_PIXELS_PER_SEC,
      SINGLE_SLOT_TITLE_MIN_DURATION_SEC
    ),
    SINGLE_SLOT_TITLE_MAX_DURATION_SEC
  );
};

const SingleSlotTitle = ({ title }: { title: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [marqueeState, setMarqueeState] = useState({
    isOverflowing: false,
    distance: 0,
    duration: SINGLE_SLOT_TITLE_MIN_DURATION_SEC,
  });

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const updateOverflow = () => {
      const clientWidth = container.clientWidth;
      const scrollWidth = text.scrollWidth;
      const isOverflowing = scrollWidth > clientWidth + 1;
      const distance = isOverflowing
        ? scrollWidth + SINGLE_SLOT_TITLE_MARQUEE_GAP
        : 0;
      const duration = isOverflowing
        ? getSingleSlotTitleDuration(distance)
        : SINGLE_SLOT_TITLE_MIN_DURATION_SEC;

      setMarqueeState((prev) =>
        prev.isOverflowing === isOverflowing &&
        prev.distance === distance &&
        prev.duration === duration
          ? prev
          : { isOverflowing, distance, duration }
      );
    };

    updateOverflow();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOverflow);
      return () => window.removeEventListener("resize", updateOverflow);
    }

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(container);
    resizeObserver.observe(text);
    return () => resizeObserver.disconnect();
  }, [title]);

  const marqueeStyle = marqueeState.isOverflowing
    ? ({
        "--single-slot-title-marquee-distance": `${marqueeState.distance}px`,
        "--single-slot-title-marquee-duration": `${marqueeState.duration}s`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={containerRef}
      className="text-18pxr md:text-28pxr font-bold leading-[22px] md:leading-[36px] tracking-[-1px] text-black-100 overflow-hidden"
      aria-label={marqueeState.isOverflowing ? title : undefined}
      title={title}
    >
      <span
        className={
          marqueeState.isOverflowing
            ? "flex w-max single-slot-title-marquee"
            : "block max-w-full truncate whitespace-nowrap"
        }
        style={marqueeStyle}
        aria-hidden={marqueeState.isOverflowing}
      >
        <span ref={textRef} className="block whitespace-nowrap">
          {title}
        </span>
        {marqueeState.isOverflowing && (
          <span className="block whitespace-nowrap pl-[48px]">{title}</span>
        )}
      </span>
    </div>
  );
};

// 원스토리 단일구좌(OneadayBox) DOM을 그대로 매핑한다.
// 왼쪽 텍스트(제목 1줄 + 소개 2줄), 오른쪽 표지(rectangle) + 좌상단 UP 뱃지.
const SingleSlot = ({ slot }: Props) => {
  const { product, summaryText } = slot;
  const coverImagePath = resolveProductCoverImage(
    product.image?.coverImagePath
  );
  const isDefaultCoverImage = coverImagePath === DEFAULT_PRODUCT_IMAGE;

  return (
    // OneadayBox
    <div className="w-full max-w-[1120px] mx-auto px-16pxr md:px-0 pt-22pxr md:pt-46pxr">
      {/* OneadayBoxWrap */}
      <div className="w-full">
        {/* OneadayBoxInner */}
        <div className="w-full relative">
          {/* a.OneadayBoxLink */}
          <Link
            href={buildProductDetailPath(product.productId)}
            className="relative flex items-center min-h-[132px] md:min-h-[156px] bg-light-gray-100 rounded-[10px] pl-24pxr pr-[134px] md:pl-[64px] md:pr-[250px]"
          >
            {/* left: OneadayBoxHeader */}
            <div className="flex-1 min-w-0">
              {/* OneadayBoxTitle (제목 1줄) */}
              <SingleSlotTitle title={product.title} />
              {/* OneadayBoxSummary (소개글 2줄) */}
              <p className="mt-12pxr md:mt-[27px] text-14pxr md:text-20pxr leading-[20px] md:leading-[24px] tracking-[-1px] text-black-100 whitespace-pre-line line-clamp-2">
                {summaryText}
              </p>
            </div>

            {/* right: OneadayBoxLinkThumbnail */}
            <div className="absolute right-18pxr md:right-[104px] top-[-22px] md:top-[-46px]">
              {/* Thumbnail Oneaday rectangle */}
              <div className="relative w-[104px] h-[144px] md:w-[146px] md:h-[203px] rounded-[10px] overflow-hidden bg-light-gray-200">
                {/* ThumbnailInner > img.ThumbnailImg */}
                <Image
                  src={coverImagePath}
                  alt={product.title}
                  width={146}
                  height={203}
                  sizes="(max-width: 767px) 104px, 146px"
                  unoptimized={isDefaultCoverImage}
                  className="block object-cover w-full h-full"
                />
                {/* ThumbnailTopBadge > UP */}
                <div className="absolute top-[5px] left-[5px]">
                  <SquareBadge type="up" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SingleSlot;

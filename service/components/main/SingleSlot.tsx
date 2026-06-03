"use client";

import { IMainSingleSlotItem } from "@/app/api/query/product/dto";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import { buildProductDetailPath } from "@/utils/productPath";
import Image from "next/image";
import Link from "next/link";
import SquareBadge from "../common/SquareBadge";

interface Props {
  slot: IMainSingleSlotItem;
}

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
    <div
      data-main-single-slot={slot.slotKey}
      className="w-full max-w-[1120px] mx-auto px-16pxr md:px-0 pt-22pxr md:pt-46pxr"
    >
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
              <p className="text-18pxr md:text-28pxr font-bold leading-[22px] md:leading-[36px] tracking-[-1px] text-black-100 truncate">
                {product.title}
              </p>
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

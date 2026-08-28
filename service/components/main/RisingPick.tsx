"use client";

import { IRisingPickItem, RisingPickType } from "@/app/api/query/product/dto";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MainHeader from "../common/MainHeader";

interface Props {
  items: IRisingPickItem[];
}

const RISING_TYPE_EMOJI: Record<RisingPickType, string> = {
  new_work: "✨",
  comeback: "👀",
  fresh_episode: "💬",
  rising: "🔥",
};

const RISING_PICK_GUIDE_MESSAGE = [
  "집계 대상: 인기 무료 Top 10에 들지 않은 연재중 무료 작품",
  "집계 기준: 24시간 전보다 순위가 오르거나 새로 진입했고, 최근 24시간 조회가 있는 작품",
  "노출 기준: 조건을 만족한 작품 중 3작품을 3시간마다 바꿔 보여줍니다.",
];

const RisingPick = ({ items }: Props) => {
  const router = useRouter();

  if (items.length === 0) return null;

  const handleClick = (item: IRisingPickItem) => {
    setPendingProductDetailEntrySource(
      item.productId,
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_RISING_PICK
    );
    router.push(buildProductDetailPath(item.productId));
  };

  const renderRow = (item: IRisingPickItem) => (
    <li key={item.productId} className="min-w-0">
      <button
        type="button"
        onClick={() => handleClick(item)}
        className="group flex w-full min-w-0 items-center gap-12pxr py-12pxr text-left"
      >
        {item.coverImagePath ? (
          <Image
            src={item.coverImagePath}
            alt={item.title}
            width={40}
            height={56}
            sizes="40px"
            className="h-[56px] w-[40px] shrink-0 rounded-[6px] object-cover"
          />
        ) : (
          <span className="h-[56px] w-[40px] shrink-0 rounded-[6px] bg-light-gray-300" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-4pxr">
          <span className="flex min-w-0 items-baseline gap-8pxr">
            <span className="min-w-0 truncate text-15pxr font-semibold leading-[20px] text-black-100 group-hover:underline">
              {item.title}
            </span>
            <span className="shrink-0 max-w-[96px] truncate text-12pxr leading-[16px] text-dark-gray-300">
              {item.authorName || ""}
            </span>
          </span>
          <span className="line-clamp-2 text-13pxr leading-[18px] text-dark-gray-400">
            <span aria-hidden="true">{RISING_TYPE_EMOJI[item.risingType]}</span>{" "}
            {item.comment}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    <section data-home-section="rising-pick" className="w-full">
      <MainHeader
        headerText="조용히 반응 오는 중"
        hasRankingGuide
        rankingGuideMessages={RISING_PICK_GUIDE_MESSAGE}
        rankingGuideAriaLabel="조용히 반응 오는 중 산정 기준 보기"
      />

      <ul className="mt-6pxr flex flex-col px-16pxr [&>li+li]:border-t [&>li+li]:border-light-gray-300 md:mt-10pxr md:grid md:grid-cols-3 md:gap-x-28pxr md:px-0 md:[&>li+li]:border-t-0">
        {items.map(renderRow)}
      </ul>
    </section>
  );
};

export default RisingPick;

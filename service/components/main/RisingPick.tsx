"use client";

import { IRisingPickItem } from "@/app/api/query/product/dto";
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

  const renderCard = (item: IRisingPickItem) => (
    <button
      key={item.productId}
      type="button"
      onClick={() => handleClick(item)}
      className="flex w-[240px] shrink-0 flex-col gap-10pxr rounded-[12px] bg-light-gray-100 p-14pxr text-left md:w-auto"
    >
      <span className="text-13pxr leading-[18px] text-dark-gray-500">
        {item.comment}
      </span>
      <span className="flex min-w-0 items-center gap-10pxr">
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
          <span className="h-[56px] w-[40px] shrink-0 rounded-[6px] bg-light-gray-500" />
        )}
        <span className="flex min-w-0 flex-col gap-2pxr">
          <span className="truncate text-14pxr font-medium leading-[19px] text-black-100">
            {item.title}
          </span>
          <span className="truncate text-12pxr leading-[16px] text-dark-gray-400">
            {item.authorName || ""}
          </span>
        </span>
      </span>
    </button>
  );

  return (
    <section data-home-section="rising-pick" className="w-full">
      <MainHeader headerText="지금 오르는 중" />

      <div className="mt-14pxr overflow-x-auto px-16pxr scroll-hidden md:hidden">
        <div className="flex w-max gap-10pxr">{items.map(renderCard)}</div>
      </div>

      <div className="mt-16pxr hidden gap-14pxr md:grid md:grid-cols-3">
        {items.map(renderCard)}
      </div>
    </section>
  );
};

export default RisingPick;

"use client";

import { IProduct } from "@/types";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import MainHeader from "../common/MainHeader";
import SquareBadge from "../common/SquareBadge";
import {
  filterLatestUpdateProducts,
  getLatestUpdateGenreTabs,
} from "./latestUpdate";

interface Props {
  products: IProduct[];
}

const LatestUpdate = ({ products }: Props) => {
  const router = useRouter();
  const [activeGenre, setActiveGenre] = useState("전체");
  const availableGenreTabs = useMemo(
    () => getLatestUpdateGenreTabs(products),
    [products]
  );
  const visibleProducts = useMemo(
    () => filterLatestUpdateProducts(products, activeGenre),
    [activeGenre, products]
  );

  if (products.length === 0) return null;

  const handleProductClick = (product: IProduct) => {
    setPendingProductDetailEntrySource(
      product.productId,
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_BOTTOM_SUGGEST
    );
    router.push(buildProductDetailPath(product.productId));
  };

  return (
    <section data-home-section="latest-update" className="relative w-full">
      <MainHeader
        headerText="연재 업데이트"
        hasMoreButton
        compactMobileMore
        moreButtonOnClick={() => router.push("/product/free/normal")}
      />

      <div className="mt-10pxr overflow-x-auto px-16pxr scroll-hidden md:mt-16pxr md:px-0">
        <div
          className="flex w-max gap-8pxr pb-16pxr"
          role="group"
          aria-label="최신 업데이트 장르"
        >
          {availableGenreTabs.map((genre) => {
            const isActive = activeGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={activeGenre === genre}
                onClick={() => setActiveGenre(genre)}
                className={`h-36pxr shrink-0 rounded-full px-11pxr text-14pxr leading-[18px] ${
                  isActive
                    ? "bg-black-100 font-medium text-white"
                    : "border border-light-gray-300 bg-white font-normal text-dark-gray-500 hover:border-light-gray-600"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-16pxr border-t border-light-gray-300 md:mx-0">
        {visibleProducts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-28pxr md:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product, index) => (
              <li
                key={product.productId}
                className={`min-w-0 border-b border-light-gray-300 ${
                  index >= 6
                    ? "hidden lg:block"
                    : index >= 3
                      ? "hidden md:block"
                      : ""
                }`}
              >
                <button
                  type="button"
                  className="group flex w-full flex-col gap-4pxr px-2pxr py-14pxr text-left"
                  onClick={() => handleProductClick(product)}
                >
                  <span className="flex min-w-0 items-center gap-4pxr">
                    <span className="shrink-0">
                      <SquareBadge type="up" />
                    </span>
                    <span className="min-w-0 truncate text-15pxr font-medium leading-[20px] text-black-100 group-hover:underline">
                      {product.title}
                    </span>
                  </span>
                  <span className="truncate text-14pxr leading-[18px] text-dark-gray-300">
                    {product.authorNickname || product.authorName || ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-28pxr text-center text-14pxr text-dark-gray-300">
            해당 장르의 최신 업데이트 작품이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
};

export default LatestUpdate;

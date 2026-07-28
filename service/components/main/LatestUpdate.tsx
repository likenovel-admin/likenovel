"use client";

import { IProduct } from "@/types";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";
import MainHeader from "../common/MainHeader";
import SquareBadge from "../common/SquareBadge";
import {
  clampLatestUpdatePage,
  filterLatestUpdateProducts,
  getLatestUpdateGenreTabs,
  paginateLatestUpdateProducts,
} from "./latestUpdate";

interface Props {
  products: IProduct[];
}

const LatestUpdate = ({ products }: Props) => {
  const router = useRouter();
  const [activeGenre, setActiveGenre] = useState("전체");
  const [currentPage, setCurrentPage] = useState(0);
  const mobileViewportRef = useRef<HTMLDivElement | null>(null);
  const availableGenreTabs = useMemo(
    () => getLatestUpdateGenreTabs(products),
    [products]
  );
  const visibleProducts = useMemo(
    () => filterLatestUpdateProducts(products, activeGenre),
    [activeGenre, products]
  );
  const mobilePages = useMemo(
    () => paginateLatestUpdateProducts(visibleProducts),
    [visibleProducts]
  );

  useEffect(() => {
    const nextPage = clampLatestUpdatePage(currentPage, mobilePages.length);
    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);
    const viewport = mobileViewportRef.current;
    viewport?.scrollTo({
      left: viewport.clientWidth * nextPage,
      behavior: "auto",
    });
  }, [currentPage, mobilePages.length]);

  if (products.length === 0) return null;

  const handleProductClick = (product: IProduct) => {
    setPendingProductDetailEntrySource(
      product.productId,
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_BOTTOM_SUGGEST
    );
    router.push(buildProductDetailPath(product.productId));
  };

  const goToPage = (pageIndex: number) => {
    const nextPage = clampLatestUpdatePage(pageIndex, mobilePages.length);
    setCurrentPage(nextPage);

    const viewport = mobileViewportRef.current;
    viewport?.scrollTo({
      left: viewport.clientWidth * nextPage,
      behavior: "smooth",
    });
  };

  const handleMobileScroll = (event: UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    if (viewport.clientWidth === 0) return;

    setCurrentPage(
      clampLatestUpdatePage(
        Math.round(viewport.scrollLeft / viewport.clientWidth),
        mobilePages.length
      )
    );
  };

  const renderProductItem = (product: IProduct, isFocusable: boolean) => (
    <li
      key={product.productId}
      className="min-w-0 border-b border-light-gray-300"
    >
      <button
        type="button"
        className="group flex w-full flex-col gap-4pxr px-2pxr py-14pxr text-left"
        tabIndex={isFocusable ? undefined : -1}
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
  );

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
                onClick={() => {
                  setActiveGenre(genre);
                  goToPage(0);
                }}
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

      {visibleProducts.length > 0 ? (
        <>
          <div
            ref={mobileViewportRef}
            className="scroll-hidden snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:hidden"
            onScroll={handleMobileScroll}
          >
            <div className="flex">
              {mobilePages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  aria-hidden={pageIndex !== currentPage}
                  className="min-w-full snap-start px-16pxr"
                >
                  <ul className="border-t border-light-gray-300">
                    {page.map((product) =>
                      renderProductItem(product, pageIndex === currentPage)
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {mobilePages.length > 1 && (
            <div className="flex items-center justify-center gap-[8px] py-[10px] md:hidden">
              {mobilePages.map((_, pageIndex) => (
                <button
                  key={pageIndex}
                  type="button"
                  aria-label={`${pageIndex + 1}번째 작품 페이지`}
                  onClick={() => goToPage(pageIndex)}
                  className="flex cursor-pointer items-center p-[4px]"
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

          <div className="hidden border-t border-light-gray-300 md:block">
            <ul className="grid grid-cols-1 gap-x-28pxr md:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) =>
                renderProductItem(product, true)
              )}
            </ul>
          </div>
        </>
      ) : (
        <p className="mx-16pxr border-t border-light-gray-300 py-28pxr text-center text-14pxr text-dark-gray-300 md:mx-0">
          해당 장르의 최신 업데이트 작품이 없습니다.
        </p>
      )}
    </section>
  );
};

export default LatestUpdate;

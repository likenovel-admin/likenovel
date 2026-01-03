"use client";

import { useGetRecentProduct } from "@/app/api/query/product";
import Modal from "@/components/common/Modal";
import RecentlyViewedProductModal from "@/components/main/RecentlyViewedProductModal";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import { IProduct } from "@/types";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import ArrowUp from "/public/images/arrow-up.svg";

type FloatingDockProps = {
  footerOffset?: number;
};

export default function FloatingDock({
  footerOffset = 110,
}: FloatingDockProps) {
  const { setModal } = useModalStore();
  const { isAuthenticated, user } = useAuthStore();
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showDock, setShowDock] = useState(false);

  const adultYn = user?.isOnAdult ? "Y" : "N";

  // Use API to get recent products if authenticated, otherwise use localStorage
  const { data: recentProductsData, refetch } = useGetRecentProduct(
    undefined,
    adultYn,
    isAuthenticated
  );

  const [recentProducts, setRecentProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    if (isAuthenticated && recentProductsData?.data) {
      // Use API data when authenticated
      setRecentProducts(recentProductsData.data);
    }
  }, [isAuthenticated, recentProductsData]);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollToTop(scrollY > 200);
      setShowDock(scrollY > 100);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const safeCount =
    recentProducts.length > 99
      ? "99+"
      : recentProducts.length > 0
      ? String(recentProducts.length)
      : null;

  const avatarUrl =
    recentProducts[0]?.image?.coverImagePath ||
    recentProducts[0]?.coverImagePath ||
    "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp";

  const handleProductsChange = (updatedProducts: IProduct[]) => {
    setRecentProducts(updatedProducts);
    // Refetch API data if authenticated
    if (isAuthenticated) {
      refetch();
    }
  };

  const handleOpenEpisode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(
      <RecentlyViewedProductModal
        products={recentProducts}
        onProductsChange={handleProductsChange}
        isAuthenticated={isAuthenticated}
      />
    );
  };

  return (
    <>
      <div
        className="fixed right-4 md:right-6 z-40"
        style={{ bottom: `${footerOffset}px` }}
      >
        <div className="flex flex-col items-center gap-10pxr select-none">
          {/* Avatar + badge - only show when authenticated, dock is visible, and has recent products */}
          {isAuthenticated && recentProducts.length > 0 && (
            <div
              className={`hidden md:flex flex-col items-center transition-opacity ${
                showDock ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={!showDock}
            >
              {safeCount && (
                <span className="absolute z-[1] right-[-3px] top-[-4px] min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] md:text-xs flex items-center justify-center font-semibold shadow-md">
                  {safeCount}
                </span>
              )}
              <button
                type="button"
                className="relative w-[50px] h-[50px] rounded-full overflow-hidden shadow-lg bg-white"
                aria-label="Open latest view"
                onClick={handleOpenEpisode}
              >
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  fill
                  sizes="50px"
                  className="object-cover"
                  priority
                />
              </button>
            </div>
          )}

          {/* TOP - only show when scroll position is > 200 */}
          <button
            type="button"
            onClick={scrollToTop}
            className={`flex flex-col items-center gap-[4px] justify-center w-[50px] h-[50px] rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] ring-1 ring-black/5 hover:ring-black/10 active:scale-95 transition-opacity ${
              showScrollToTop ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll to top"
            aria-hidden={!showScrollToTop}
          >
            <ArrowUp className="w-11pxr h-6pxr" />
            <span className="text-[10px] md:text-xs tracking-wider font-semibold">
              TOP
            </span>
          </button>
        </div>
      </div>
      <Modal
        size={"md"}
        hasBlackOverlay={true}
        justifyAlign="end"
        itemsAlign="end"
      />
    </>
  );
}

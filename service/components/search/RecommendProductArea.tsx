import { useGetSuggestByRecentViewed } from "@/app/api/query/product";
import { useSelectWeeklyMostSearched } from "@/app/api/query/search";
import { resolveProductCoverImage } from "@/constants/common";
// import {
//   useSelectProductSuggestByRecentViewed,
// } from "@/app/api/query/search";
import useAuthStore from "@/store/authStore";
import useSearchModalStore from "@/store/searchModalStore";
import { IProduct } from "@/types";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MobileProducts from "../common/MobileProducts";
import UserNickname from "../common/UserNickname";
import ArrowLeft from "/public/images/arrow-left-small.svg";
import ArrowRight from "/public/images/arrow-right-small.svg";
import Click from "/public/images/click.svg";
import Good from "/public/images/good-3d.svg";

interface Props {
  type: "mostSearched" | "recommend";
}
const ITEMS_PER_PAGE = 6;
const RecommendProductArea = ({ type }: Props) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { closeSearchModal } = useSearchModalStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [recentViewedProductId, setRecentViewedProductId] = useState<
    number | null
  >(null);

  // Get recent viewed product ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const recentViewedProducts: IProduct[] = JSON.parse(
          localStorage.getItem("recent_viewed_products") || "[]"
        );
        // Get first product ID (most recent)
        if (recentViewedProducts.length > 0) {
          setRecentViewedProductId(recentViewedProducts[0].productId);
        }
      } catch (error) {
        console.error("Error parsing recent_viewed_products:", error);
      }
    }
  }, []);

  // API calls based on type
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const { data: weeklyMostSearchedData } = useSelectWeeklyMostSearched(adultYn, 6);
  // const { data: suggestByRecentViewedData } =
  //   useSelectProductSuggestByRecentViewed(recentViewedProductId || 0);
  const { data: suggestByRecentViewedData } = useGetSuggestByRecentViewed();

  const products =
    type === "mostSearched"
      ? weeklyMostSearchedData?.data || []
      : suggestByRecentViewedData?.data || [];

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentData = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="flex items-center gap-6pxr pl-16pxr md:pl-0">
          {type === "mostSearched" ? <Click /> : <Good />}
          <span className="font-semibold">
            {type === "mostSearched" ? "금주 최다 검색작품" : "추천 작품"}
          </span>
        </div>
        {products.length > ITEMS_PER_PAGE && (
          <div className="hidden md:flex items-center gap-10pxr">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`${currentPage === 1 ? "text-gray-300" : ""}`}
            >
              <ArrowLeft />
            </button>
            <div className="flex gap-3pxr text-13pxr font-medium">
              <span
                className={`${currentPage === 1 ? "" : "text-dark-gray-200"}`}
              >
                {String(currentPage === 1 ? 1 : currentPage - 1).padStart(
                  2,
                  "0"
                )}
              </span>
              <span className={`text-dark-gray-200`}>-</span>
              <span
                className={`${currentPage === 1 ? "text-dark-gray-200" : ""}`}
              >
                {String(currentPage === 1 ? 2 : currentPage).padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`${currentPage === totalPages ? "text-gray-300" : ""}`}
            >
              <ArrowRight />
            </button>
          </div>
        )}
      </div>
      {products.length === 0 ? (
        <div className="flex justify-center items-center py-20 text-dark-gray-400 text-14pxr">
          {type === "mostSearched"
            ? "검색된 작품이 없습니다."
            : "추천 작품이 없습니다."}
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-6 gap-5pxr mt-14pxr">
            {currentData.map((product, index) => (
              <div
                className="flex flex-col gap-10pxr cursor-pointer"
                key={product.productId + index}
                onClick={() => {
                  setPendingProductDetailEntrySource(
                    product.productId,
                    type === "mostSearched"
                      ? PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_MOST_SEARCHED
                      : PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_RECOMMEND
                  );
                  router.push(buildProductDetailPath(product.productId));
                  closeSearchModal();
                }}
              >
                <div className="relative">
                  <img
                    src={resolveProductCoverImage(
                      product.image.coverImagePath
                    )}
                    alt="작품표지"
                    width={97}
                    height={146}
                    className={`object-cover w-[97px] h-[146px] rounded-[10px] transition duration-300 ease-in-out`}
                  />
                </div>
                <span className="w-[92px] text-14pxr font-medium leading-[16px] line-clamp-2">
                  {product.title}
                </span>
                <UserNickname
                  product={product as any}
                  userNickname={product.authorNickname || ""}
                  textStyle="text-12pxr text-dark-gray-400"
                />
              </div>
            ))}
          </div>
          <div className="md:hidden">
            <MobileProducts
              headerText=""
              products={(currentData as unknown as IProduct[]) ?? []}
              entrySource={
                type === "mostSearched"
                  ? PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_MOST_SEARCHED
                  : PRODUCT_DETAIL_ENTRY_SOURCE.SEARCH_RECOMMEND
              }
            />
          </div>
        </>
      )}
    </div>
  );
};
export default RecommendProductArea;

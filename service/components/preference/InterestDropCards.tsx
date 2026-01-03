import { useSelectInterestDropProducts } from "@/app/api/query/product";
import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BookmarkButton from "../common/BookmarkButton";
import CircleArrow from "../common/CircleArrow";
import InterestBadge from "../common/InterestBadge";
import MainHeader from "../common/MainHeader";
import ProductStateBadge from "../common/ProductStateBadge";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

const InterestDropCards = () => {
  const router = useRouter();
  const device = useMediaDevice();
  const [currentPage, setCurrentPage] = useState(0);
  // 관심 끊기기 임박 api 연동
  const { data: interestDropProducts } = useSelectInterestDropProducts();
  const [bookmarkedItems, setBookmarkedItems] = useState<{
    [key: number]: boolean;
  }>({});
  const itemsPerPage = 4;
  const data: any = interestDropProducts ? interestDropProducts.data : [];

  // Old logic: Pagination-based (move entire page)
  // const currentProducts =
  //   device === "mobile" || device === "tablet"
  //     ? data
  //     : data?.slice(
  //         currentPage * itemsPerPage,
  //         (currentPage + 1) * itemsPerPage
  //       );

  // New logic: Index-based scrolling (move one item at a time)
  const currentProducts =
    device === "mobile" || device === "tablet"
      ? data
      : data?.slice(
          // currentPage * itemsPerPage,
          // (currentPage + 1) * itemsPerPage
          currentPage,
          currentPage + itemsPerPage
        );

  const totalItems = data.length;

  // Old logic: Calculate total pages
  // const lastPage = Math.ceil(totalItems / itemsPerPage) - 1;

  // New logic: Calculate max index
  const lastPage = Math.max(0, totalItems - itemsPerPage);

  const handleNextPage = () => {
    // Old logic: Move to next page
    // if ((currentPage + 1) * itemsPerPage < data.length) {
    //   setCurrentPage(currentPage + 1);
    // }

    // New logic: Move one item forward
    if (currentPage < lastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    // New logic remains same as old
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleBookmark = (productId: number) => {
    setBookmarkedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="relative flex flex-col mt-27pxr">
      <MainHeader
        headerText="관심 끊기기 임박"
        textStyle="text-20pxr font-bold text-white"
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/preference/interest-drop");
        }}
      />
      <div className="mt-15pxr scroll-hidden overflow-x-auto">
        <div className="flex gap-15pxr pl-16pxr md:pl-0 overflow-visible">
          {(currentProducts as unknown as IProduct[]).map((product, index) => (
            <div
              key={product.productId}
              className={`relative flex min-w-[264px] min-h-[166px] bg-white rounded-[10px] shadow-lg cursor-pointer mb-5`}
              onClick={() => {
                router.push(`/product/${product.productId}`);
              }}
            >
              {product.image && product.image.coverImagePath ? (
                <Image
                  src={product.image.coverImagePath}
                  alt={product.title}
                  width={110}
                  height={166}
                  className="object-cover rounded-lg md:rounded-l-lg md:rounded-r-none"
                />
              ) : (
                <Image
                  src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                  alt={product.title}
                  width={110}
                  height={166}
                  className={`object-cover rounded-lg md:rounded-l-lg md:rounded-r-none`}
                />
              )}

              {product.priceType === "paid" && (
                <div className="absolute flex gap-[2px] bottom-[5px] left-[5px]">
                  <SquareBadge
                    type={getPromotionBadgeType(
                      product.badge?.waitForFreeYn ||
                        product.badge?.waitingForFreeYn,
                      product.badge?.freeEpisodeTicketCount,
                      product.badge?.timepassFromTo,
                      product.badge?.sixNinePathYn
                    )}
                    freeEpisodeNumber={product.badge?.freeEpisodeTicketCount}
                    timePassValue={product.badge?.timepassFromTo}
                  />
                </div>
              )}
              <div className="relative flex flex-col justify-between pt-15pxr pb-12pxr pl-19pxr">
                <div className="flex flex-col gap-3pxr w-[120px] mr-[20px]">
                  <div className="mt-[-5px]">
                    <ProductStateBadge
                      product={product as unknown as IProduct}
                      hasUpBadge={false}
                    />
                  </div>
                  <span className="relative text-17pxr font-semibold leading-[22px] line-clamp-2 pr-[20px]">
                    {product.title}
                    {getIsNewEpisode(
                      product.properties?.latestEpisodeDate || ""
                    ) && (
                      <div
                        className={`absolute bottom-[2px] inline-block ${
                          product.title.length > 15 ? "right-[7px]" : "ml-[5px]"
                        }`}
                      >
                        <SquareBadge type="up" />
                      </div>
                    )}
                  </span>
                  <span className="text-14pxr text-dark-gray-400">
                    {getLatestEpisodeDate(
                      product.properties?.latestEpisodeDate || ""
                    )}
                  </span>
                  <InterestBadge
                    product={product as unknown as IProduct}
                    width={11}
                    height={15}
                    style="absolute bottom-[50px] left-[20px]"
                  />
                </div>
                <div>
                  <div className="w-[120px] border border-b border-light-gray-200" />
                  <div className="flex justify-between mt-9pxr items-center mr-[20px]">
                    <div className="flex">
                      <UserNickname
                        product={product as unknown as IProduct}
                        userNickname={product.authorNickname || ""}
                        textStyle="text-13pxr text-dark-gray-400"
                      />
                    </div>
                    <BookmarkButton
                      productId={product.productId}
                      bookmarkYn={product.properties?.bookmarkYn || "N"}
                      bookmarkStyle="w-[16px] h-[19px] text-dark-gray-300 hover:text-dark-gray-500"
                      activeBookmarkStyle="w-[16px] h-[19px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute top-[50%] left-[-20px] z-5 hidden lg:block">
            <CircleArrow
              direction="left"
              onClick={handlePrevPage}
              isDisabled={currentPage === 0}
              color="black"
            />
          </div>
          <div className="absolute top-[50%] right-[-20px] z-5 hidden lg:block">
            <CircleArrow
              direction="right"
              onClick={handleNextPage}
              isDisabled={currentPage === lastPage}
              color="black"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default InterestDropCards;

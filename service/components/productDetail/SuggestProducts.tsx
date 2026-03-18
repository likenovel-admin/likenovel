import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface Props {
  title?: string;
  products: IProduct[];
  entrySource?: ProductDetailEntrySource;
}

const PAGE_SIZE = 6;

const SuggestProducts = ({ products, title, entrySource }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize =
    device === "miniTablet" ? 4 : device === "tablet" ? 5 : PAGE_SIZE;

  const currentProducts = products.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  const totalItems = products.length;
  const lastPage = Math.ceil(totalItems / pageSize) - 1;
  const handleNextPage = () => {
    if (currentPage < lastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  const navigateToProductDetail = (productId: number) => {
    if (entrySource) {
      setPendingProductDetailEntrySource(productId, entrySource);
    }
    router.push(buildProductDetailPath(productId));
  };
  return (
    <div>
      <span className="text-18pxr md:text-22pxr font-bold">
        {title || "추천 작품"}
      </span>
      <div className="relative mt-17pxr">
        <div className="grid grid-cols-4 2md:grid-cols-5 lg:grid-cols-6 scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr md:pl-0">
          {currentProducts.map((product) => (
            <div
              key={product.productId}
              className="relative flex flex-col cursor-pointer"
              onClick={() => {
                navigateToProductDetail(product.productId);
              }}
            >
              <div className="relative">
                {product.image && product.image.coverImagePath ? (
                  <Image
                    src={product.image?.coverImagePath ?? ""}
                    alt={product.title}
                    width={120}
                    height={170}
                    className={`object-cover min-w-[120px] h-[170px] rounded-[10px]`}
                  />
                ) : (
                  <Image
                    src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                    alt={product.title}
                    width={120}
                    height={170}
                    className={`object-cover min-w-[120px] h-[170px] rounded-[10px]`}
                  />
                )}
                <div className="absolute flex gap-[2px] bottom-[5px] left-[5px]">
                  {product.priceType === "paid" && product.badge && (
                    <SquareBadge
                      type={getPromotionBadgeType(
                        product.badge.waitForFreeYn ||
                          product.badge.waitingForFreeYn,
                        product.badge.freeEpisodeTicketCount,
                        product.badge.timepassFromTo,
                        product.badge.sixNinePathYn
                      )}
                      freeEpisodeNumber={product.badge.freeEpisodeTicketCount}
                      timePassValue={product.badge.timepassFromTo}
                    />
                  )}
                  {getIsNewEpisode(
                    product.properties?.latestEpisodeDate || ""
                  ) && <SquareBadge type="up" />}
                </div>
              </div>
              <div className="flex items-start gap-10pxr mt-14pxr">
                <div className="max-w-[120px]">
                  <span className="font-medium line-clamp-2 mb-13pxr">
                    {product.title}
                  </span>
                  <UserNickname
                    product={product}
                    userNickname={product.authorNickname || ""}
                    textStyle="text-dark-gray-400 text-13pxr font-normal"
                    badgeStyle="w-[12px] md:w-[14px] h-[12px] md:h-[16px]"
                  />
                </div>
              </div>
            </div>
          ))}
          {totalItems > pageSize && (
            <>
              <div className="absolute top-[30%] left-[-15px] z-5">
                <CircleArrow
                  direction="left"
                  onClick={handlePrevPage}
                  isDisabled={currentPage === 0}
                />
              </div>
              <div className="absolute top-[30%] right-[-15px] z-5">
                <CircleArrow
                  direction="right"
                  onClick={handleNextPage}
                  isDisabled={currentPage === lastPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default SuggestProducts;

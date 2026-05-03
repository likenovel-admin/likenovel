import Button from "@/components/common/Button";
import { resolveProductCoverImage } from "@/constants/common";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import Image from "next/image";
import { useState } from "react";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import ProductSearchModal from "./ProductSearchModal";
import Bookmark from "/public/images/bookmark.svg";
import Search from "/public/images/search.svg";
import View from "/public/images/view.svg";

interface RecommendProductSearchProps {
  product: IProduct | null;
  setProduct: (product: IProduct | null) => void;
}

const RecommendProductSearch = ({
  product,
  setProduct,
}: RecommendProductSearchProps) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(true);
  return (
    <>
      {product ? (
        <RecommendProduct product={product} setProduct={setProduct} />
      ) : (
        <div className="p-6 text-center">
          <div>추천작품을 쓰기 전에</div>
          <div>
            <b>추천할 작품</b>을 먼저 검색해주세요
          </div>
          <Button
            variant="black"
            size="lg"
            className="mt-6 w-[166px]"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search className="mr-2 w-4 h-4" />
            추천작품 검색
          </Button>
        </div>
      )}
      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(product) => {
          setProduct(product);
          setIsSearchModalOpen(false);
        }}
      />
    </>
  );
};

const RecommendProduct = ({
  product,
  setProduct,
}: {
  product: IProduct;
  setProduct: (product: IProduct | null) => void;
}) => {
  return (
    <div className="flex items-start gap-2 justify-start w-full border-b pb-4 md:p-5 md:border md:rounded-3xl">
      <div className="flex gap-2">
        <div className="flex relative w-81pxr h-auto aspect-[81/120] rounded-[5px] overflow-hidden">
          <Image
            src={resolveProductCoverImage(product.image?.coverImagePath)}
            fill
            alt="책"
            className="rounded-[5px]"
          />
          <div className="z-10 absolute top-[2px] left-[2px]">
            {product.badge && (
              <SquareBadge
                type={getPromotionBadgeType(
                  product.badge?.waitForFreeYn ||
                    product.badge?.waitingForFreeYn,
                  product.badge?.freeEpisodeTicketCount,
                  product.badge?.timepassFromTo,
                  product.badge?.sixNinePathYn
                )}
                freeEpisodeNumber={product.badge.freeEpisodeTicketCount || 0}
                timePassValue={product.badge.timepassFromTo}
                size="small"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex gap-0.5 items-center">
            {product.priceType === "free" && (
              <SquareBadge type={"free"} size="small" />
            )}
            {product.badge?.newReleaseYn === "Y" && (
              <SquareBadge type={"new"} size="small" />
            )}
            {getIsNewEpisode(product.properties?.latestEpisodeDate || "") && (
              <SquareBadge type="up" />
            )}
            {product.trendindex && (
              <div className="relative w-[12px] h-[15px] ml-1">
                <Image src={"/images/test/fire.svg"} fill alt="인기" />
              </div>
            )}
          </div>
          <span className="text-16pxr font-semibold mt-1 line-clamp-1">
            {product.title}
          </span>
          <div className="flex gap-1 items-center">
            <UserNickname
              userNickname={product.authorNickname}
              product={product}
              hasGle
            />
            {product.illustratorNickname && (
              <span className="text-12pxr text-gray-600">
                {` | ${product.illustratorNickname}`}
              </span>
            )}
          </div>
          <div className="flex items-center text-14pxr text-gray-600 mt-1">
            <span className="text-14pxr text-[#4D5159]">
              {/* 총 {product.trendindex?.hasEpisodeCount}화 */}총{" "}
              {product.totalOpenEpisodeCount}화
            </span>
            <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full mx-11pxr" />
            <span className="text-14pxr text-[#4D5159]">
              {getUpdateFrequency(product.properties?.updateFrequency || "")}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex gap-3 mt-3">
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <View className="w-3 h-[14px]" />
                {product.trendindex?.cpHitCount || 0}
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Image
                  src="/images/like.svg"
                  width={15}
                  height={12}
                  alt="좋아요"
                />
                {product.trendindex?.totalInterestCount || 0}
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Bookmark className="w-[8px] h-[13px]" />
                {product.trendindex?.interestSustainCount || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => setProduct(null)}
        className="flex items-center ml-auto md:my-auto justify-center w-[32px] h-[32px] rounded-full bg-gray-100"
      >
        <Image src={"/images/recycle.svg"} width={14} height={16} alt="삭제" />
      </button>
    </div>
  );
};

export default RecommendProductSearch;

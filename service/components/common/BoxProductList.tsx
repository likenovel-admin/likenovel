import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { useRouter } from "next/navigation";
import RankingBadge from "../common/RankingBadge";
import SquareBadge from "../common/SquareBadge";
import InterestBadge from "./InterestBadge";
import UserNickname from "./UserNickname";
interface Props {
  data: IProduct[];
  pageType: "free" | "paid";
  hasLank?: boolean;
}
const BoxProductList = ({ data, pageType, hasLank = false }: Props) => {
  const router = useRouter();
  const renderAdultCoverImage = useAdultCoverImage();
  return (
    <div className="max-w-[1120px] mx-auto mt-20pxr md:mt-0">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 2md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-7 2xl:grid-cols-7 gap-10pxr md:gap-15pxr px-16pxr md:px-0">
        {data.map((product) => (
          <div
            key={product.productId}
            className="cursor-pointer"
            onClick={() => {
              router.push(`/product/${product.productId}`);
            }}
          >
            <div className="relative">
              {renderAdultCoverImage(
                product,
                148,
                215,
                "object-cover min-w-[95px] md:min-w-[148px] min-h-[150px] md:h-[215px] rounded-[10px]"
              )}
              <InterestBadge
                product={product as unknown as IProduct}
                width={10}
                height={14}
                style="absolute top-[5px] right-[5px] md:hidden"
              />
              {hasLank && (
                <div className="absolute top-[-5px] left-[10px] hidden md:block">
                  <RankingBadge rank={product.rank?.currentRank || 0} />
                </div>
              )}
              {hasLank && (
                <div className="absolute flex justify-center items-center top-0 left-0 md:hidden bg-black-100 w-[30px] h-[30px] rounded-tl-[10px] rounded-br-[10px]">
                  <span className="text-14pxr text-white">
                    {product.rank?.currentRank}
                  </span>
                </div>
              )}
              <div className="absolute flex gap-[2px] bottom-[5px] left-[5px]">
                {pageType === "paid" && (
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
                )}
                {getIsNewEpisode(
                  product.properties?.latestEpisodeDate || ""
                ) && <SquareBadge type="up" />}
              </div>
            </div>
            <div className="relative max-w-[137px] mt-13pxr">
              <span className="text-15pxr md:text-16pxr font-medium line-clamp-1">
                {product.title}
              </span>
              <UserNickname
                product={product as unknown as IProduct}
                userNickname={product.authorNickname || ""}
                textStyle="text-dark-gray-400 text-13pxr"
                badgeStyle="w-[14px] h-[14px]"
              />
              <InterestBadge
                product={product as unknown as IProduct}
                width={10}
                height={14}
                style="hidden md:block absolute bottom-[5px] right-[-10px]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BoxProductList;

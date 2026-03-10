import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import ErrorArea from "../common/ErrorArea";
import MainHeader from "../common/MainHeader";
import RankingBadge from "../common/RankingBadge";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
interface Props {
  data: IProduct[] | null;
}

const PAGE_SIZE = 6;

const PaidTop = ({ data }: Props) => {
  const router = useRouter();
  const renderAdultCoverImage = useAdultCoverImage();
  const device = useMediaDevice();
  const [currentPage, setCurrentPage] = useState(0);

  if (!data || !data.length) {
    return <ErrorArea />;
  }

  // Old logic: Pagination-based (move entire page)
  // const currentProducts =
  //   device === "mobile" || device === "tablet"
  //     ? data
  //     : data.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // New logic: Index-based scrolling (move one item at a time)
  const currentProducts =
    device === "mobile" || device === "tablet"
      ? data
      : // data.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
        data.slice(currentPage, currentPage + PAGE_SIZE);

  const totalItems = data.length;

  // Old logic: Calculate total pages
  // const lastPage = Math.ceil(totalItems / PAGE_SIZE) - 1;

  // New logic: Calculate max index
  const lastPage = Math.max(0, totalItems - PAGE_SIZE);

  const handleNextPage = () => {
    setCurrentPage(currentPage >= lastPage ? 0 : currentPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage <= 0 ? lastPage : currentPage - 1);
  };

  return (
    <div className="max-w-[1120px] mx-auto py-30pxr md:py-70pxr">
      <MainHeader
        headerText="유료 Top"
        textStyle="text-17pxr md:text-24pxr font-bold text-white"
        hasTimeSpeechBubble
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/top50/paid-top");
        }}
      />
      <div className="relative h-[260px] md:h-[360px]">
        <div className="mt-10pxr md:pt-20pxr flex gap-[16px] bg-[#212123] scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr md:pl-0">
          {(currentProducts as unknown as IProduct[]).map((product) => (
            <div
              key={product.productId}
              className="relative flex flex-col cursor-pointer flex-shrink-0"
              onClick={() => {
                router.push(`/product/${product.productId}`);
              }}
            >
              <div className="relative">
                {renderAdultCoverImage(
                  product,
                  167,
                  255,
                  "object-cover w-[108px] md:w-[167px] h-[164px] md:h-[255px] rounded-[10px]"
                )}
                <div className="absolute top-[-5px] left-[10px] hidden md:block">
                  <RankingBadge rank={product.rank?.currentRank || 0} />
                </div>
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
                  {getIsNewEpisode(
                    product.properties?.latestEpisodeDate || ""
                  ) && <SquareBadge type="up" />}
                </div>
              </div>
              <div className="flex items-start gap-10pxr mt-14pxr">
                <span className="text-14pxr text-white font-medium md:hidden">
                  {product.rank?.currentRank || 0}
                </span>
                <div className="border-l-dark-gray-500 border border-r-0 border-t-0 border-b-0 h-[15px] mt-[4px] md:hidden" />
                <div className="max-w-[80px] md:max-w-[170px]">
                  <span className="text-white text-14pxr md:text-16pxr line-clamp-1">
                    {product.title}
                  </span>
                  <UserNickname
                    userNickname={product.authorNickname || ""}
                    product={product as unknown as IProduct}
                    textStyle="text-dark-gray-100 text-11pxr md:text-13pxr font-normal"
                    badgeStyle="w-[12px] md:w-[14px] h-[12px] md:h-[16px]"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="absolute top-[40%] left-[-15px] z-5 hidden lg:block">
            <CircleArrow
              direction="left"
              onClick={handlePrevPage}
            />
          </div>
          <div className="absolute top-[40%] right-[-15px] z-5 hidden lg:block">
            <CircleArrow
              direction="right"
              onClick={handleNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaidTop;

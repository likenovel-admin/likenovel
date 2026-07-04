import AdultAgeBadge from "@/components/common/AdultAgeBadge";
import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { shouldShowProductUpBadge } from "@/utils/productBadge";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import ErrorArea from "../common/ErrorArea";
import MainHeader from "../common/MainHeader";
import RankingBadge from "../common/RankingBadge";
import RankHistoryModal from "../top50/RankHistoryModal";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
interface Props {
  data: IProduct[] | null;
}

const PAGE_SIZE = 6;
const RANK_HISTORY_VISIBLE_FROM_KST = "2026-06-03";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getKstDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

const PaidTop = ({ data }: Props) => {
  const router = useRouter();
  const renderAdultCoverImage = useAdultCoverImage();
  const device = useMediaDevice();
  const [currentPage, setCurrentPage] = useState(0);
  const [isRankHistoryOpen, setIsRankHistoryOpen] = useState(false);
  const [rankHistoryDate, setRankHistoryDate] = useState(getTodayDateString);

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
  const isRankHistoryTriggerVisible =
    getKstDateString() >= RANK_HISTORY_VISIBLE_FROM_KST;

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
        timeSpeechBubbleMode="ranking"
        timeSpeechBubbleOnClick={
          isRankHistoryTriggerVisible
            ? () => setIsRankHistoryOpen(true)
            : undefined
        }
        timeSpeechBubbleAriaLabel="시간대별 랭킹 보기"
        timeSpeechBubbleShowActionIndicator={isRankHistoryTriggerVisible}
        hasRankingGuide
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/top50/paid-top");
        }}
      />
      <div className="relative h-[260px] md:h-[360px]">
        <div className="mt-10pxr md:pt-20pxr flex gap-16pxr md:gap-18pxr bg-[#212123] scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr md:pl-0">
          {(currentProducts as unknown as IProduct[]).map((product) => (
            <div
              key={product.productId}
              className="relative flex flex-col cursor-pointer flex-shrink-0"
              onClick={() => {
                setPendingProductDetailEntrySource(
                  product.productId,
                  PRODUCT_DETAIL_ENTRY_SOURCE.HOME_PAID_TOP
                );
                router.push(buildProductDetailPath(product.productId));
              }}
            >
              <div className="relative">
                {renderAdultCoverImage(
                  product,
                  167,
                  255,
                  "object-cover w-[108px] md:w-[167px] h-[164px] md:h-[255px] rounded-[10px]",
                  {
                    optimized: true,
                    sizes: "(max-width: 767px) 108px, 167px",
                  }
                )}
                <AdultAgeBadge product={product} />
                <div className="absolute -top-4pxr -left-4pxr md:hidden">
                  <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-black/70 text-white text-11pxr font-semibold">
                    {product.rank?.currentRank || 0}
                  </span>
                </div>
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
                  {shouldShowProductUpBadge(product) && (
                    <SquareBadge type="up" />
                  )}
                </div>
              </div>
              <div className="flex items-start gap-10pxr mt-14pxr">
                <div className="w-[108px] md:w-[170px]">
                  <span className="text-white text-14pxr md:text-16pxr line-clamp-2">
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
      <RankHistoryModal
        open={isRankHistoryOpen}
        area="paidSerialTop"
        date={rankHistoryDate}
        onDateChange={setRankHistoryDate}
        onClose={() => setIsRankHistoryOpen(false)}
      />
    </div>
  );
};
export default PaidTop;

import { useUpdateConversionProduct } from "@/app/api/query/author/product";
import ProductStateBadge from "@/components/common/ProductStateBadge";
import RankingBadge from "@/components/common/RankingBadge";
import SquareBadge from "@/components/common/SquareBadge";
import UserNickname from "@/components/common/UserNickname";
import ApplyPaidModal from "@/components/modal/ApplyPaidModal";
import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import useMediaDevice from "@/hooks/useMediaDevice";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GeneralPromotionModal from "../modal/GeneralPromotionModal";
import Bookmark from "/public/images/bookmark.svg";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import View from "/public/images/view.svg";

interface Props {
  data: IProduct;
  hasRank?: boolean;
  hasGle?: boolean;
  hasInterestBadge?: boolean;
  hasPromotionBadge?: boolean;
  isAdultFilterEnabled?: boolean;
  refetch?: () => void;
  entrySource?: ProductDetailEntrySource;
}

const ProductListCard = ({
  data,
  hasRank = false,
  hasInterestBadge = false,
  hasPromotionBadge = false,
  isAdultFilterEnabled = false,
  hasGle = true,
  refetch,
  entrySource,
}: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const renderAdultCoverImage = useAdultCoverImage();
  const { setModal } = useModalStore();
  const { setToast } = useToastStore();
  const updateConversionProductMutation = useUpdateConversionProduct();
  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  const [isActiveBookmark, setIsActiveBookmark] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isOpenHelper, setIsOpenHelper] = useState<{
    type: "normal" | "paid";
    isOpen: boolean;
  }>({
    type: "normal",
    isOpen: false,
  });
  useEffect(() => {
    const calculateDaysAgo = () => {
      const currentDate = new Date();
      const lastEpisodeDate = new Date(
        data.properties?.latestEpisodeDate ?? ""
      );
      const timeDifference = currentDate.getTime() - lastEpisodeDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      return daysDifference;
    };
    setDaysAgo(calculateDaysAgo());
  }, [data.properties?.latestEpisodeDate]);

  const navigateToProductDetail = () => {
    if (entrySource) {
      setPendingProductDetailEntrySource(data.productId, entrySource);
    }
    router.push(buildProductDetailPath(data.productId));
  };

  const handleOpenGeneralPromotion = () => {
    const handleConfirm = async () => {
      if (updateConversionProductMutation.isPending) {
        return;
      }
      try {
        await updateConversionProductMutation.mutateAsync(
          {
            productId: data.productId,
            category: "rank-up",
          },
          {
            onSuccess: () => {
              setToast({
                message: "일반 승급 신청이 완료되었습니다.",
                type: "success",
              });
              refetch && refetch();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "일반 승급 신청에 실패했습니다. 다시 시도해 주세요.",
                type: "error",
              });
            },
          }
        );
      } catch (error) {
        setToast({
          message: "일반 승급 신청에 실패했습니다. 다시 시도해 주세요.",
          type: "error",
        });
      }
    };

    setModal(<GeneralPromotionModal data={data} onConfirm={handleConfirm} />);
  };

  const handleOpenApplyPaid = () => {
    const handleConfirm = async () => {
      if (updateConversionProductMutation.isPending) {
        return;
      }
      try {
        await updateConversionProductMutation.mutateAsync(
          {
            productId: data.productId,
            category: "paid",
          },
          {
            onSuccess: () => {
              setToast({
                message: "유료 전환 신청이 완료되었습니다.",
                type: "success",
              });
              refetch && refetch();
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message ||
                  "유료 전환 신청에 실패했습니다. 다시 시도해 주세요.",
                type: "error",
              });
            },
          }
        );
      } catch (error) {
        setToast({
          message: "유료 전환 신청에 실패했습니다. 다시 시도해 주세요.",
          type: "error",
        });
      }
    };

    setModal(<ApplyPaidModal data={data} onConfirm={handleConfirm} />);
  };

  return (
    <>
      <div
        className={`relative flex w-full justify-between min-h-[155px] md:min-h-[208px] ${"cursor-pointer"} `}
      >
        <div
          className={`relative flex items-center border-b ${"w-full"}  gap-12pxr md:gap-20pxr py-[16px] md:py-[20px]`}
          onClick={() => {
            navigateToProductDetail();
          }}
        >
          {hasRank && data.rank && (
            <>
              <span className="md:hidden min-w-[14px] text-17pxr font-bold">
                {data.rank?.currentRank || 0}
              </span>
              <div className="hidden md:block">
                <RankingBadge
                  rank={data.rank?.currentRank || 0}
                  rankIndicator={data.rank?.rankIndicator || 0}
                />
              </div>
            </>
          )}
          <div
            className="relative bg-black-100 min-w-[86px] md:min-w-[110px] h-[130px] md:h-[166px] rounded-[10px]"
            onClick={() => {
              setIsClicked(!isClicked);
            }}
          >
            {isAdultFilterEnabled ? (
              <>
                {renderAdultCoverImage(
                  data,
                  110,
                  166,
                  `hidden md:block object-cover min-w-[110px] h-[166px] rounded-[10px]`
                )}
                {renderAdultCoverImage(
                  data,
                  110,
                  166,
                  `md:hidden object-cover min-w-[86px] h-[130px] rounded-[10px] ${
                    isClicked ? "opacity-0" : "opacity-100"
                  }`
                )}
              </>
            ) : data.image && data.image.coverImagePath ? (
              <>
                <Image
                  src={data.image.coverImagePath}
                  alt={data.title}
                  width={80}
                  height={120}
                  className={`hidden md:block object-cover min-w-[110px] h-[166px] rounded-[10px]`}
                />
                <Image
                  src={data.image.coverImagePath}
                  alt={data.title}
                  width={80}
                  height={120}
                  className={`md:hidden object-cover min-w-[86px] h-[130px] rounded-[10px] ${
                    isClicked ? "opacity-0" : "opacity-100"
                  }`}
                />
              </>
            ) : (
              <>
                <Image
                  src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                  alt={data.title}
                  width={80}
                  height={120}
                  className={`hidden md:block object-cover min-w-[110px] h-[166px] rounded-[10px]`}
                />
                <Image
                  src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                  alt={data.title}
                  width={80}
                  height={120}
                  className={`md:hidden object-cover min-w-[86px] h-[130px] rounded-[10px] ${
                    isClicked ? "opacity-0" : "opacity-100"
                  }`}
                />
              </>
            )}
            {isClicked ? (
              <div
                className={`md:hidden absolute w-[75px] top-[5px] left-[5px] flex flex-wrap`}
              >
                {Array.from(
                  new Set([...(data.genre || []), ...(data.keywords || [])])
                ).map((item: string, index: number) => (
                  <span
                    key={index}
                    className={`text-white text-10pxr mr-[1px]`}
                  >
                    #{item}
                  </span>
                ))}
              </div>
            ) : (
              <>
                {hasPromotionBadge &&
                  data.priceType === "paid" &&
                  data.badge && (
                    <div
                      className={`absolute flex bottom-[5px] md:top-[5px] left-[5px] gap-[2px]`}
                    >
                      <SquareBadge
                        type={getPromotionBadgeType(
                          data.badge?.waitForFreeYn ||
                            data.badge?.waitingForFreeYn,
                          data.badge?.freeEpisodeTicketCount,
                          data.badge?.timepassFromTo,
                          data.badge?.sixNinePathYn
                        )}
                        freeEpisodeNumber={data.badge?.freeEpisodeTicketCount}
                        timePassValue={data.badge?.timepassFromTo}
                      />
                    </div>
                  )}
              </>
            )}
          </div>
          <div className=" flex flex-col w-full gap-3pxr">
            <div className="hidden md:flex items-center gap-7pxr">
              <span className="text-17pxr font-semibold">{data.title}</span>
              <ProductStateBadge product={data} hasFreeOrPaidBadge />
            </div>
            <div className="md:hidden flex flex-col gap-3pxr">
              <div className="flex gap-10pxr">
                <ProductStateBadge product={data} hasFreeOrPaidBadge />
              </div>
              <span
                className="text-14pxr font-semibold"
                onClick={navigateToProductDetail}
              >
                {data.title}
              </span>
            </div>
            <div className="flex flex-wrap gap-5pxr md:gap-12pxr items-center">
              <UserNickname
                userNickname={data.authorNickname || ""}
                product={data}
                hasGle={hasGle}
              />
              {data.properties && data.properties?.latestEpisodeDate && (
                <>
                  <div className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                  <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                    {getLatestEpisodeDate(data.properties?.latestEpisodeDate)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                {/* 총 {data.trendindex?.hasEpisodeCount}화 */}총{" "}
                {data.totalOpenEpisodeCount}화
              </span>
              {data.properties?.updateFrequency && (
                <div className="w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
              )}
              {!!data.properties?.updateFrequency && (
                <>
                  <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                    {getUpdateFrequency(data.properties?.updateFrequency || "")}
                  </span>
                </>
              )}
              {getUpdateFrequency(data.properties?.updateFrequency || "") &&
                data.genre.length > 0 && (
                  <div className="md:hidden w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
                )}
            </div>

            {data.trendindex && (
              <div className="flex w-full gap-15pxr">
                <div className="flex items-center gap-3pxr">
                  <View className="w-[14px] h-[12px] text-dark-gray-400" />
                  <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                    {data.trendindex.hitCount}
                  </span>
                  {/* <RankIndicator
                    rankIndicator={data.trendindex.hitIndicator ?? 0}
                    textStyles="text-10pxr"
                  /> */}
                </div>
                <div className="flex items-center gap-3pxr">
                  <ThumbsUp className="w-[15px] h-[12px]" />
                  <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                    {data.trendindex.recommendCount}
                  </span>
                  {/* <RankIndicator
                    rankIndicator={data.trendindex.recommendIndicator ?? 0}
                    textStyles="text-10pxr"
                  /> */}
                </div>
                <div className="flex items-center gap-3pxr">
                  <Bookmark className="w-[10px] h-[15px] text-dark-gray-400" />
                  <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                    {data.trendindex.bookmarkCount}
                  </span>
                  {/* <RankIndicator
                    rankIndicator={data.trendindex.bookmarkIndicator ?? 0}
                    textStyles="text-10pxr"
                  /> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default ProductListCard;

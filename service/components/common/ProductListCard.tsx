import { useUpdateConversionProduct } from "@/app/api/query/author/product";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import ApplyPaidModal from "@/components/modal/ApplyPaidModal";
import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import { useAiLibrarianDwellReveal } from "@/hooks/useAiLibrarianDwellReveal";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import useChatStore from "@/store/chatStore";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import { formatPercentMetric } from "@/utils/formatProductMetric";
import {
  type AiProductBrief,
  buildAiLibrarianCopy,
  buildProductDetailAiLibrarianPath,
} from "@/utils/aiLibrarian";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { openAiLibrarianPanel } from "@/utils/aiLibrarianPanel";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import AiLibrarianListPreview from "../aiLibrarian/AiLibrarianListPreview";
import GeneralPromotionModal from "../modal/GeneralPromotionModal";
import AdultAgeBadge from "./AdultAgeBadge";
import BookmarkButton from "./BookmarkButton";
import Button from "./Button";
import InterestBadge from "./InterestBadge";
import ProductRemarkContent from "./ProductRemarkContent";
import ProductStateBadge from "./ProductStateBadge";
import RankIndicator from "./RankIndicator";
import RankingBadge from "./RankingBadge";
import SquareBadge from "./SquareBadge";
import UserNickname from "./UserNickname";
import Bookmark from "/public/images/bookmark.svg";
import Check from "/public/images/check.svg";
import Clock from "/public/images/clock.svg";
import ExclamationMark from "/public/images/exclamation-mark.svg";
import Medal from "/public/images/medal.svg";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import TriangleWarnRed from "/public/images/triangle-warn-red.svg";
import View from "/public/images/view.svg";
import Won from "/public/images/won.svg";

interface Props {
  data: IProduct;
  hasRank?: boolean;
  hasGle?: boolean;
  hasInterestBadge?: boolean;
  hasPromotionBadge?: boolean;
  isAuthorPage?: boolean;
  isReviewPage?: boolean;
  isAdultFilterEnabled?: boolean;
  hideStats?: boolean;
  refetch?: () => void;
  entrySource?: ProductDetailEntrySource;
  enableAiLibrarianPreview?: boolean;
  aiLibrarianBrief?: AiProductBrief | null;
}

const ProductListCard = ({
  data,
  hasRank = false,
  hasInterestBadge = false,
  hasPromotionBadge = false,
  isAuthorPage = false,
  isReviewPage = false,
  isAdultFilterEnabled = false,
  hideStats = false,
  hasGle = true,
  refetch,
  entrySource,
  enableAiLibrarianPreview = false,
  aiLibrarianBrief = null,
}: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const renderAdultCoverImage = useAdultCoverImage();
  const { setModal } = useModalStore();
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const updateConversionProductMutation = useUpdateConversionProduct();
  const { user } = useAuthStore();
  const setAiLibrarianPanelOpen = useChatStore((state) => state.setIsOpen);
  const requestProductQuestion = useChatStore(
    (state) => state.requestProductQuestion
  );
  const aiLibrarianCopy = useMemo(
    () =>
      aiLibrarianBrief
        ? buildAiLibrarianCopy(data, aiLibrarianBrief)
        : null,
    [data, aiLibrarianBrief]
  );
  const shouldShowAiLibrarianPreview =
    enableAiLibrarianPreview &&
    Boolean(aiLibrarianCopy) &&
    !isAuthorPage &&
    !isReviewPage;
  const { ref: aiLibrarianDwellRef, isRevealed: isAiLibrarianRevealed } =
    useAiLibrarianDwellReveal({
      productId: data.productId,
      enabled: shouldShowAiLibrarianPreview,
    });

  // Check if current user is the author of this product
  const isProductAuthor = user?.userId === data.authorId;
  const isCPAdmin = user?.userRole === "CP" || user?.userRole === "admin";
  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  const [isActiveBookmark, setIsActiveBookmark] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const coverImagePath = resolveProductCoverImage(data.image?.coverImagePath);
  const isDefaultCoverImage = coverImagePath === DEFAULT_PRODUCT_IMAGE;
  const [isOpenHelper, setIsOpenHelper] = useState<{
    type: "normal" | "paid";
    isOpen: boolean;
  }>({
    type: "normal",
    isOpen: false,
  });
  const canShowApplyNormalButton = false;
  const canShowApplyPaidButton =
    data.priceType === "free" &&
    data.productType === "normal" &&
    data.contract?.monopolyYn === "Y" &&
    data.state &&
    data.state.convertToPaidState !== "review" &&
    data.state.convertToPaidState !== "approval" &&
    data.state.canApplyForPaid === true;
  const episodeCount = data.trendindex?.hasEpisodeCount ?? 0;
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const productDetailPath = buildProductDetailPath(data.productId);
  const recordProductDetailEntrySource = () => {
    if (entrySource) {
      setPendingProductDetailEntrySource(data.productId, entrySource);
    }
  };
  const navigateToProductDetail = () => {
    recordProductDetailEntrySource();
    router.push(productDetailPath);
  };
  const handleProductLinkClick = (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.stopPropagation();
    recordProductDetailEntrySource();
  };
  const navigateToAiLibrarianDetail = () => {
    if (entrySource) {
      setPendingProductDetailEntrySource(data.productId, entrySource);
    }
    router.push(buildProductDetailAiLibrarianPath(data.productId));
  };
  const handleAskAiLibrarianMore = () => {
    openAiLibrarianPanel({
      setIsOpen: setAiLibrarianPanelOpen,
    });
    requestProductQuestion({
      productId: data.productId,
      prompt: data.title
        ? `${data.title} 이 작품 어떤 작품인지 알려줘`
        : "이 작품 어떤 작품인지 알려줘",
    });
  };

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
    if (data.contract?.monopolyYn !== "Y") {
      setConfirm({
        content:
          "유료전환을 하기 위해서는 독점 상태로 변경해야 합니다.",
        buttonCount: 1,
      });
      return;
    }

    if (data.contract?.cpContractYn !== "Y") {
      setConfirm({
        content:
          "계약 상태 작품만 유료전환 신청이 가능합니다. 작품수정에서 계약 여부를 먼저 설정해주세요.",
        buttonCount: 1,
      });
      return;
    }

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
        ref={aiLibrarianDwellRef}
        className={`relative flex w-full justify-between rounded-[10px] md:border border-light-gray-500 ${
          isAuthorPage
            ? "min-h-[210px] flex-wrap md:min-h-[260px]"
            : "min-h-[155px] md:min-h-[208px]"
        } ${
          isAuthorPage ? "" : "cursor-pointer"
        }  md:hover:shadow-lg`}
      >
        <div
          className={`relative flex items-start ${
            isAuthorPage ? "w-full md:w-[60%] cursor-pointer" : "w-full"
          } gap-12pxr md:gap-20pxr p-[16px] md:p-[20px]`}
          onClick={() => {
            // Navigate to author page if user is the product author (in review page context)
            // Otherwise navigate to regular product detail page
            if (device !== "mobile") {
              isAuthorPage
                ? router.push(
                    `/product/author/episode-manager/${data.productId}`
                  )
                : navigateToProductDetail();
            }
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
            className="relative min-w-[86px] md:min-w-[110px] h-[130px] md:h-[166px] rounded-[10px] overflow-hidden"
            onClick={(event) => {
              if (isAuthorPage) {
                event.stopPropagation();
                router.push(
                  `/product/author/episode-manager/${data.productId}`
                );
                return;
              }
              setIsClicked(!isClicked);
            }}
          >
            {isClicked && (
              <div className="md:hidden absolute inset-0 bg-black-100 rounded-[10px]" />
            )}
            {isAdultFilterEnabled ? (
              <>
                {renderAdultCoverImage(
                  data,
                  110,
                  166,
                  `hidden md:block object-cover min-w-[110px] h-[166px] rounded-[10px] block`,
                  {
                    optimized: true,
                    sizes: "110px",
                  }
                )}
                {renderAdultCoverImage(
                  data,
                  110,
                  166,
                  `md:hidden object-cover min-w-[86px] h-[130px] rounded-[10px] block ${
                    isClicked ? "opacity-0" : "opacity-100"
                  }`,
                  {
                    optimized: true,
                    sizes: "86px",
                  }
                )}
              </>
            ) : (
              <>
                <Image
                  src={coverImagePath}
                  alt={data.title}
                  width={110}
                  height={166}
                  className={`hidden md:block object-cover min-w-[110px] h-[166px] rounded-[10px] block`}
                  unoptimized={isDefaultCoverImage}
                  loading={isDefaultCoverImage ? "eager" : "lazy"}
                />
                <Image
                  src={coverImagePath}
                  alt={data.title}
                  width={110}
                  height={166}
                  className={`md:hidden object-cover min-w-[86px] h-[130px] rounded-[10px] block ${
                    isClicked ? "opacity-0" : "opacity-100"
                  }`}
                  unoptimized={isDefaultCoverImage}
                  loading={isDefaultCoverImage ? "eager" : "lazy"}
                />
              </>
            )}
            <AdultAgeBadge
              product={data}
              className={isClicked ? "opacity-0 md:opacity-100" : ""}
              forceVisible={isAuthorPage}
            />
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
              {isAuthorPage ? (
                <span className="text-17pxr font-semibold">{data.title}</span>
              ) : (
                <Link
                  className="text-17pxr font-semibold"
                  href={productDetailPath}
                  onClick={handleProductLinkClick}
                >
                  {data.title}
                </Link>
              )}
              <ProductStateBadge product={data} hasFreeOrPaidBadge />
            </div>
            <div className="md:hidden flex flex-col gap-3pxr">
              <div className="flex items-start justify-between">
                <div className="flex gap-10pxr">
                  <ProductStateBadge product={data} hasFreeOrPaidBadge />
                </div>
                {hasInterestBadge && (
                  <InterestBadge
                    product={data}
                    width={16}
                    height={21}
                    style="md:hidden mt-[-4px] ml-10pxr"
                  />
                )}
              </div>
              <Link
                className="text-14pxr font-semibold"
                href={productDetailPath}
                onClick={handleProductLinkClick}
              >
                {data.title}
              </Link>
            </div>
            <div
              className={
                isAuthorPage
                  ? "flex flex-wrap gap-x-5pxr gap-y-3pxr md:gap-x-12pxr items-center"
                  : "flex flex-wrap gap-5pxr md:gap-12pxr items-center"
              }
            >
              <UserNickname
                userNickname={data.authorNickname || ""}
                product={data}
                hasGle={hasGle}
              />
              {data.properties && data.properties?.latestEpisodeDate && (
                isAuthorPage ? (
                  <span className="flex shrink-0 items-center gap-5pxr">
                    <span className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                    <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                      {getLatestEpisodeDate(
                        data.properties?.latestEpisodeDate
                      )}
                    </span>
                  </span>
                ) : (
                  <>
                    <div className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                    <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                      {getLatestEpisodeDate(
                        data.properties?.latestEpisodeDate
                      )}
                    </span>
                  </>
                )
              )}
            </div>
            <div className="flex items-center">
              {/* <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                {data.trendindex?.hasEpisodeCount && (
                  <>총 {data.trendindex?.hasEpisodeCount}화</>
                )}
              </span>
              {data.trendindex?.hasEpisodeCount &&
                !isAuthorPage &&
                data.properties?.updateFrequency && (
                  <div className="w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
                )} */}
              {/* <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                {!!data.totalOpenEpisodeCount && (
                  <>총 {data.totalOpenEpisodeCount}화</>
                )}
              </span>
              {!!data.totalOpenEpisodeCount &&
                !isAuthorPage &&
                !!data.properties?.updateFrequency && (
                  <div className="w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
                )} */}
              <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                총 {data.totalOpenEpisodeCount}화
              </span>
              {!isAuthorPage && !!data.properties?.updateFrequency && (
                <div className="w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
              )}
              {!isAuthorPage && !!data.properties?.updateFrequency && (
                <>
                  <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                    {getUpdateFrequency(data.properties?.updateFrequency || "", {
                publishRegularYn: data.publishRegularYn,
                ongoingState: data.state?.ongoingState,
              })}
                  </span>
                </>
              )}
              {!isAuthorPage &&
                getUpdateFrequency(data.properties?.updateFrequency || "", {
                publishRegularYn: data.publishRegularYn,
                ongoingState: data.state?.ongoingState,
              }) &&
                data.genre.length > 0 && (
                  <div className="md:hidden w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
                )}
              {isAuthorPage && data.genre.length > 0 && (
                <div className="md:hidden w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
              )}
              {data.genre.length > 0 && (
                <span className="md:hidden text-12pxr md:text-14pxr text-dark-gray-500">
                  {data.genre[0]}
                </span>
              )}
            </div>
            <div>
              {isAuthorPage && data.contract ? (
                <>
                  <div className="flex gap-4pxr">
                    <span className="text-12pxr md:text-14pxr text-dark-gray-300">
                      선인세 :
                    </span>
                    <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                      {data.contract?.advancePayment?.toLocaleString() ?? 0}원
                    </span>
                  </div>
                  <div className="flex gap-4pxr">
                    <span className="text-12pxr md:text-14pxr text-dark-gray-300">
                      제안받은 수 :
                    </span>
                    <span className="text-12pxr md:text-14pxr text-dark-gray-500">
                      {data.contract?.offerCount}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:flex flex-wrap gap-6pxr mt-17pxr">
                    {Array.from(
                      new Set([...(data.genre || []), ...(data.keywords || [])])
                    ).map((item: string, index: number) => (
                      <div
                        className="flex px-8pxr py-4pxr bg-light-gray-100 rounded-full"
                        key={index}
                      >
                        <span className="text-13pxr text-dark-gray-400">
                          #{item}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {isAuthorPage ? (
              <>
                {data.trendindex && (
                  <div className="flex w-full mt-5pxr md:mt-18pxr gap-15pxr mb-10pxr">
                    <div className="flex items-center gap-3pxr">
                      <View className="w-[14px] h-[12px] text-dark-gray-400" />
                      <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                        {data.trendindex.hitCount}
                      </span>
                      <RankIndicator
                        rankIndicator={data.trendindex.hitIndicator ?? 0}
                        textStyles="text-10pxr"
                      />
                    </div>
                    <div className="flex items-center gap-3pxr">
                      <ThumbsUp className="w-[15px] h-[12px]" />
                      <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                        {data.trendindex.recommendCount}
                      </span>
                      <RankIndicator
                        rankIndicator={data.trendindex.recommendIndicator ?? 0}
                        textStyles="text-10pxr"
                      />
                    </div>
                    <div className="flex items-center gap-3pxr">
                      <Bookmark className="w-[10px] h-[15px] text-dark-gray-400" />
                      <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                        {data.trendindex.bookmarkCount}
                      </span>
                      <RankIndicator
                        rankIndicator={data.trendindex.bookmarkIndicator ?? 0}
                        textStyles="text-10pxr"
                      />
                    </div>
                  </div>
                )}

              </>
            ) : (
              <>
                <div className="hidden md:block border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-[8px] mb-[8px]" />
                <div className="flex w-full gap-12pxr md:gap-24pxr">
                  {!hideStats && data.trendindex && (
                    <>
                      <div className="flex items-center gap-3pxr">
                        <View className="w-[14px] h-[12px] text-dark-gray-400" />
                        <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                          {data.trendindex.hitCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-3pxr">
                        <ThumbsUp className="w-[15px] h-[12px]" />
                        <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                          {data.trendindex.recommendCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-3pxr">
                        <Bookmark className="w-[10px] h-[15px] text-dark-gray-400" />
                        <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                          {data.trendindex.bookmarkCount}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="hidden md:block ml-14pxr">
                    <ProductRemarkContent
                      data={data}
                      remarkContent={
                        data.properties?.remarkContentSnippet ?? ""
                      }
                      isFree={data.priceType === "free"}
                    />
                  </div>
                </div>
              </>
            )}
            {hasInterestBadge && (
              <InterestBadge
                product={data}
                width={16}
                height={21}
                style="hidden md:block absolute right-[20px]"
              />
            )}
            {shouldShowAiLibrarianPreview && aiLibrarianCopy && (
              <div className="hidden md:block">
                <AiLibrarianListPreview
                  previewLines={aiLibrarianCopy.previewLines}
                  chips={aiLibrarianCopy.chips}
                  isVisible={isAiLibrarianRevealed}
                  onClick={navigateToAiLibrarianDetail}
                  onAskMore={handleAskAiLibrarianMore}
                />
              </div>
            )}
          </div>
        </div>
        {isAuthorPage &&
          data?.productType === "normal" &&
          data.state &&
          data.state?.convertToPaidState &&
          data.state?.convertToPaidState !== "not_applied" &&
          (data.state?.convertToPaidState === "review" ? (
            <div className="flex absolute top-[30px] right-[20px] md:right-[230px] items-center gap-3pxr md:gap-6pxr">
              <Clock className="w-[15px] md:w-[18px] h-[15px] md:h-[18px] text-[#2F7FFF]" />
              <span className="text-12pxr md:text-14pxr text-[#2F7FFF]">
                심사중
              </span>
            </div>
          ) : data.state?.convertToPaidState === "rejected" ? (
            <div className="flex absolute top-[30px] right-[20px] md:right-[230px] items-center gap-2pxr">
              <TriangleWarnRed className="mb-[-5px] w-[18px] md:w-[23px] h-[18px] md:h-[23px]" />
              <span className="text-12pxr md:text-14pxr text-red-100">
                반려
              </span>
            </div>
          ) : (
            <div className="flex absolute top-[30px] right-[20px] md:right-[230px] items-center gap-6pxr">
              <div className="flex items-center justify-center w-[15px] md:w-[18px] h-[15px] md:h-[18px] bg-[#09ABDF] rounded-full">
                <Check className="w-[8px] text-white" />
              </div>
              <span className="text-12pxr md:text-14pxr text-[#09ABDF]">
                승인
              </span>
            </div>
          ))}
        <div
          className={`hidden md:flex flex-col ${
            isAuthorPage ? "min-w-[200px]" : "min-w-[180px]"
          } min-h-[208px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0 px-17pxr py-26pxr gap-6pxr`}
        >
          {isAuthorPage ? (
            <>
              {data.trendindex && (
                <>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      CP조회수
                    </span>
                    <div className="flex gap-4pxr">
                      <span className="text-13pxr text-dark-gray-500">
                        {data.trendindex.cpHitCount || '-'}
                      </span>
                      <div className="mt-4pxr">
                        <RankIndicator
                          rankIndicator={data.trendindex.hitIndicator ?? 0}
                          textStyles="text-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      연독률
                    </span>
                    <div className="flex gap-4pxr">
                      <span className="text-13pxr text-dark-gray-500">
                        {formatPercentMetric(data.trendindex.readThroughRate)}
                      </span>
                      <div className="mt-4pxr">
                        <RankIndicator
                          rankIndicator={
                            data.trendindex.readThroughIndicator ?? 0
                          }
                          textStyles="text-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      누적 관심수
                    </span>
                    <div className="flex gap-4pxr">
                      <span className="text-13pxr text-dark-gray-500">
                        {data.trendindex.totalInterestCount || '-'}
                      </span>
                      <div className="mt-4pxr">
                        <RankIndicator
                          rankIndicator={
                            data.trendindex.totalInterestIndicator ?? 0
                          }
                          textStyles="text-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      관심유지
                    </span>
                    <div className="flex gap-4pxr">
                      <span className="text-13pxr text-dark-gray-500">
                        {data.trendindex.interestSustainCount || '-'}
                      </span>
                      <div className="mt-4pxr">
                        <RankIndicator
                          rankIndicator={
                            data.trendindex.interestSustainIndicator ?? 0
                          }
                          textStyles="text-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      관심이탈
                    </span>
                    <div className="flex gap-4pxr">
                      <span className="text-13pxr text-dark-gray-500">
                        {data.trendindex.interestLossCount || '-'}
                      </span>
                      <div className="mt-4pxr">
                        <RankIndicator
                          rankIndicator={
                            data.trendindex.interestLossIndicator ?? 0
                          }
                          textStyles="text-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      주요 독자층
                    </span>
                    <span className="text-13pxr text-dark-gray-500">
                      {data.trendindex.primaryReaderGroup?.["1"] ?? ""} <br />
                      {data.trendindex.primaryReaderGroup?.["2"] ?? ""}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            data.trendindex &&
            data.properties && (
              <>
                {(isCPAdmin || isProductAuthor) && (
                  <div className="flex justify-between gap-20pxr">
                    <span className="text-13pxr text-dark-gray-300">
                      CP조회수
                    </span>
                    <span className="text-13pxr text-dark-gray-500">
                      {data.trendindex.cpHitCount || '-'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-20pxr">
                  <span className="text-13pxr text-dark-gray-300">연독률</span>
                  <span className="text-13pxr text-dark-gray-500">
                    {formatPercentMetric(data.trendindex.readThroughRate)}
                  </span>
                </div>
                <div className="flex justify-between gap-20pxr">
                  <span className="text-13pxr text-dark-gray-300">
                    주평균 연재횟수
                  </span>
                  <span className="text-13pxr text-dark-gray-500">
                    {data.properties.averageWeeklyEpisodes ? Number(data.properties.averageWeeklyEpisodes).toFixed(1) : '-'}
                  </span>
                </div>
                <div className="flex justify-between gap-20pxr">
                  <span className="text-13pxr text-dark-gray-300">
                    주요 독자층
                  </span>
                  <span className="text-13pxr text-dark-gray-500">
                    {data.trendindex.primaryReaderGroup?.["1"] || "-"}
                    {data.trendindex.primaryReaderGroup?.["2"] ? (
                      <>
                        <br />
                        {data.trendindex.primaryReaderGroup?.["2"]}
                      </>
                    ) : null}
                  </span>
                </div>
              </>
            )
          )}
        </div>
        {!isAuthorPage && (
          <>
            <div className="absolute bottom-[17px] right-[11px] md:hidden flex items-center gap-7pxr">
              {data.trendindex && data.properties && (
                <button
                  className={`flex items-center justify-center w-[20px] h-[20px] rounded-full border border-light-gray-600 ${
                    isMobileStatsOpen ? "bg-black-100" : "bg-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileStatsOpen((prev) => !prev);
                  }}
                  aria-label={isMobileStatsOpen ? "통계 접기" : "통계 펼치기"}
                >
                  <span
                    className={`text-12pxr font-semibold leading-none ${
                      isMobileStatsOpen ? "text-white" : "text-dark-gray-300"
                    }`}
                  >
                    i
                  </span>
                </button>
              )}
              <BookmarkButton
                productId={data.productId}
                bookmarkYn={data.properties?.bookmarkYn || "N"}
                buttonStyle="flex items-center justify-center w-[32px] h-[35px]"
                bookmarkStyle="w-[16px] h-[19px] text-dark-gray-200 hover:text-dark-gray-500"
                activeBookmarkStyle="w-[16px] h-[19px]"
              />
            </div>
            {data.trendindex && data.properties && isMobileStatsOpen && (
              <div className="absolute bottom-[52px] right-[10px] md:hidden z-10 min-w-[190px] rounded-[10px] bg-white border border-light-gray-500 p-10pxr">
                {(isCPAdmin || isProductAuthor) && (
                  <div className="flex justify-between gap-16pxr">
                    <span className="text-11pxr text-dark-gray-300">
                      CP조회수
                    </span>
                    <span className="text-11pxr text-dark-gray-500">
                      {data.trendindex.cpHitCount || '-'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-16pxr">
                  <span className="text-11pxr text-dark-gray-300">
                    연독률
                  </span>
                  <span className="text-11pxr text-dark-gray-500">
                    {formatPercentMetric(data.trendindex.readThroughRate)}
                  </span>
                </div>
                <div className="flex justify-between gap-16pxr">
                  <span className="text-11pxr text-dark-gray-300">
                    주평균 연재횟수
                  </span>
                  <span className="text-11pxr text-dark-gray-500">
                    {data.properties.averageWeeklyEpisodes ? Number(data.properties.averageWeeklyEpisodes).toFixed(1) : '-'}
                  </span>
                </div>
                <div className="flex justify-between gap-16pxr">
                  <span className="text-11pxr text-dark-gray-300">
                    주요 독자층
                  </span>
                  <span className="text-11pxr text-dark-gray-500 text-right">
                    {data.trendindex.primaryReaderGroup?.["1"] || "-"}
                    {data.trendindex.primaryReaderGroup?.["2"] ? (
                      <>
                        <br />
                        {data.trendindex.primaryReaderGroup?.["2"]}
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-[17px] right-[65px] p-2 md:hidden">
              <ProductRemarkContent
                data={data}
                remarkContent={data.properties?.remarkContentSnippet ?? ""}
                isFree={data.priceType === "free"}
              />
            </div>
          </>
        )}

        {isAuthorPage && (
          <div className="flex w-full flex-col items-center gap-10pxr px-16pxr pb-16pxr md:px-20pxr md:pb-20pxr">
            <div className="flex items-center justify-center gap-8pxr">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-[120px] px-20pxr"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(
                    `/product/author/episode-manager/${data.productId}`
                  );
                }}
              >
                작품관리
              </Button>
              <Button
                type="button"
                variant={episodeCount === 0 ? "primary" : "black"}
                size="sm"
                className="min-w-[150px] px-24pxr"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/making-episode/${data.productId}`);
                }}
              >
                {episodeCount === 0 ? "신규회차쓰기" : "회차쓰기"}
              </Button>
            </div>

            {canShowApplyNormalButton ? (
              <div className="flex items-center gap-12pxr">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex w-[130px] gap-5pxr text-12pxr md:text-14pxr font-normal"
                  onClick={handleOpenGeneralPromotion}
                >
                  <Medal />
                  일반 승급 신청
                </Button>
                <button
                  type="button"
                  className={`flex justify-center items-center w-[20px] h-[20px] rounded-full border border-light-gray-600 ${
                    isOpenHelper.isOpen
                      ? "bg-black-100 hover:bg-dark-gray-600"
                      : "hover:bg-light-gray-100"
                  }`}
                  onClick={() => {
                    setIsOpenHelper({
                      type: "normal",
                      isOpen: !isOpenHelper.isOpen,
                    });
                  }}
                >
                  <ExclamationMark
                    className={`${
                      isOpenHelper.isOpen
                        ? "text-white"
                        : "text-dark-gray-300"
                    }`}
                  />
                </button>
              </div>
            ) : canShowApplyPaidButton ? (
              <div className="flex items-center gap-12pxr">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex w-[135px] gap-5pxr text-12pxr md:text-14pxr font-normal"
                  onClick={handleOpenApplyPaid}
                >
                  <div className="flex justify-center items-center w-[18px] h-[18px] bg-[#FFBC39] rounded-full">
                    <Won className="w-[11px] h-[6px] ml-[1px]" />
                  </div>
                  유료 전환 신청
                </Button>
                <button
                  type="button"
                  className={`flex justify-center items-center w-[20px] h-[20px] rounded-full border border-light-gray-600 ${
                    isOpenHelper.isOpen
                      ? "bg-black-100 hover:bg-dark-gray-600"
                      : "hover:bg-light-gray-100"
                  }`}
                  onClick={() => {
                    setIsOpenHelper({
                      type: "paid",
                      isOpen: !isOpenHelper.isOpen,
                    });
                  }}
                >
                  <ExclamationMark
                    className={`${
                      isOpenHelper.isOpen
                        ? "text-white"
                        : "text-dark-gray-300"
                    }`}
                  />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {isAuthorPage && isOpenHelper.isOpen && (
          <div
            className={`absolute bottom-[-50px] md:bottom-[-30px] ${
              isOpenHelper.type === "normal"
                ? "right-[60px] md:right-[200px] w-[250px]"
                : "right-[58px] md:right-[215px] w-[235px]"
            } inline-block h-[60px] p-7pxr text-12pxr text-white bg-black-100 rounded-[14px] z-10 leading-[15px]`}
          >
            {isOpenHelper.type === "normal" ? (
              <span>
                글자 수 및 회차 수 기준을 총족하면 일반으로 승급 신청이
                가능합니다. 작품은 무료-자유에서 무료-일반으로 옮겨집니다.
              </span>
            ) : (
              <span>
                유료 전환 신청 후 심사는 최대 1주가 소요되며, <br /> 승인 또는
                반려가 될 수 있습니다. <br /> 반려 후에는 1회 재신청이
                가능합니다.
              </span>
            )}
            <div className="absolute top-[-4px] left-3/4 md:left-1/4 w-2 h-2 bg-black-100 rotate-45"></div>
          </div>
        )}
      </div>
      {shouldShowAiLibrarianPreview && aiLibrarianCopy && (
        <div className="md:hidden px-[16px]">
          <AiLibrarianListPreview
            previewLines={aiLibrarianCopy.previewLines}
            chips={aiLibrarianCopy.chips}
            isVisible={isAiLibrarianRevealed}
            onClick={navigateToAiLibrarianDetail}
            onAskMore={handleAskAiLibrarianMore}
          />
        </div>
      )}
      <div className="md:hidden w-[93%] ml-[16px] border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
    </>
  );
};
export default ProductListCard;

import { useReportProduct } from "@/app/api/query/product";
import AdultAgeBadge from "@/components/common/AdultAgeBadge";
import { resolveProductCoverImage } from "@/constants/common";
import Modal from "@/components/common/Modal";
import ReportModal from "@/components/modal/ReportModal";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IEvaluation, IProduct } from "@/types";
import { formatKoreanNumber } from "@/utils/formatKoreanNumber";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import {
  getLatestEpisodeDate,
  isEndDateExpired,
} from "@/utils/getLatestEpisodeDate";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import {
  findPreviousNonMatchingPath,
  logNavigationHistory,
} from "@/utils/navigationHistory";
import { logProductTrace } from "@/utils/productTrace";
import type { ProductDetailEntrySource } from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import { getWebsochatLaunchEligibility } from "@/utils/websochatLaunch";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import BookmarkButton from "../common/BookmarkButton";
import Button from "../common/Button";
import ProductReaction from "../common/ProductReaction";
import ProductStateBadge from "../common/ProductStateBadge";
import Spinner from "../common/Spinner";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import WebsochatEntryCtas from "./WebsochatEntryCtas";
import WebsochatMiniPreview from "./WebsochatMiniPreview";
import SuggestionModal from "../modal/SuggestionModal";
import Another from "/public/images/another.svg";
import ArrowDown from "/public/images/arrow-down.svg";
import Bookmark from "/public/images/bookmark.svg";
import Return from "/public/images/return.svg";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import View from "/public/images/view.svg";

interface Props {
  data: IProduct;
  isSuccess?: boolean;
  isLoading?: boolean;
  evaluations: Partial<IEvaluation>;
  episodeId?: number;
  latestEpisodeNo?: number;
  latestEpisodeTitle?: string;
  episodeCount?: number;
  firstEpisodeId?: number;
  firstEpisodeTitle?: string;
  entrySource?: ProductDetailEntrySource | null;
}

const ProductCoverArea = ({
  data,
  isSuccess,
  isLoading,
  evaluations,
  episodeId,
  latestEpisodeNo,
  latestEpisodeTitle,
  episodeCount,
  firstEpisodeId,
  firstEpisodeTitle,
  entrySource,
}: Props) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const { setModal } = useModalStore();
  const { withLoginRequired } = useAuthWrapper();
  const reportProduct = useReportProduct();
  const [openSuggestionModal, setOpenSuggestionModal] = useState(false);
  const [isSynopsisOpen, setIsSynopsisOpen] = useState(false);
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [isActiveBookmark, setIsActiveBookmark] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const coverImagePath = resolveProductCoverImage(data?.image?.coverImagePath);
  const [isInterestTooltipOpen, setIsInterestTooltipOpen] = useState(false);
  const extraMenuRef = useRef<HTMLDivElement | null>(null);
  const synopsisRef = useRef<HTMLDivElement | null>(null);
  const interestTooltipRef = useRef<HTMLButtonElement | null>(null);
  const interestTooltipMessage =
    "무료작품을 최근 3일 내 1회차 이상 읽으면 관심 상태가 유지됩니다.";

  const latestEpisodeDateLabel = getLatestEpisodeDate(
    data?.properties?.latestEpisodeDate || ""
  );

  useEffect(() => {
    logProductTrace(
      "product-cover-area",
      "render-state",
      {
        isLoading,
        isSuccess,
        hasData: !!data,
        productId: data?.productId ?? null,
        title: data?.title ?? null,
        coverImagePath: data?.image?.coverImagePath ?? null,
        latestEpisodeNo: latestEpisodeNo ?? null,
        latestEpisodeTitle: latestEpisodeTitle ?? null,
        episodeCount: episodeCount ?? null,
      },
      {
        pathname: typeof window !== "undefined" ? window.location.pathname : undefined,
        productId: data?.productId,
      }
    );
  }, [
    data,
    episodeCount,
    isLoading,
    isSuccess,
    latestEpisodeNo,
    latestEpisodeTitle,
  ]);

  const isShowButtonProposal =
    user &&
    (user?.userRole === "CP" || user?.userRole === "editor") &&
    data?.productType !== "paid" &&
    data?.priceType !== "paid";
  const isAuthor =
    !!user?.userId && !!data?.authorId && user.userId === data.authorId;
  const isAdminCPEditor =
    user?.userRole === "CP" ||
    user?.userRole === "editor" ||
    user?.userRole === "admin";
  const promotionBadgeType = getPromotionBadgeType(
    data?.badge?.waitForFreeYn || data?.badge?.waitingForFreeYn,
    data?.badge?.freeEpisodeTicketCount,
    data?.badge?.timepassFromTo,
    data?.badge?.sixNinePathYn
  );
  const hasStateBadge =
    data?.state?.ongoingState === "end" ||
    data?.state?.ongoingState === "rest" ||
    data?.state?.ongoingState === "stop" ||
    data?.contract?.monopolyYn === "Y" ||
    data?.badge?.newReleaseYn === "Y" ||
    getIsNewEpisode(
      data?.properties?.latestEpisodeDate || data?.latestEpisodeDate || ""
    );
  const hasPromotionBadge =
    data?.priceType === "paid" && promotionBadgeType.length > 0;
  const hasHeaderBadges = !!data?.priceType || hasStateBadge;
  const websochatContextStatus =
    typeof (data as { contextStatus?: string | null } | undefined)?.contextStatus === "string"
      ? (data as { contextStatus?: string | null }).contextStatus
      : null;
  const websochatLaunchEligibility = getWebsochatLaunchEligibility({
    productId: data?.productId,
    title: data?.title,
    priceType: data?.priceType,
    publishedLatestEpisodeNo: data?.latestEpisodeNo,
    syncedLatestEpisodeNo: data?.syncedLatestEpisodeNo,
    contextStatus: websochatContextStatus,
  });
  const shouldShowWebsochatEntryCta = websochatLaunchEligibility.canLaunch;
  const shouldShowWebsochatUnavailable =
    websochatLaunchEligibility.displayState === "unavailable";
  const shouldShowEvaluationContainer = false;
  const shouldShowRightPanel =
    shouldShowWebsochatEntryCta ||
    shouldShowWebsochatUnavailable ||
    shouldShowEvaluationContainer;

  const handleGoBack = () => {
    if (process.env.NODE_ENV === "development") {
      logNavigationHistory();
    }

    const previousPath = findPreviousNonMatchingPath([
      /^\/product\/\d+$/, // Match /product/{id}
      /^\/viewer\/\d+$/, // Match /viewer/{id}
    ]);

    if (previousPath) {
      router.push(previousPath);
      return;
    }

    if (isAuthor) {
      router.push("/product/author");
      return;
    }

    router.back();
  };
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setToast({
          message: (
            <span className="flex items-center gap-13pxr text-14pxr md:text-16pxr">
              URL이 복사되었습니다.
            </span>
          ),
          type: "success",
        });
      })
      .catch((err) => {
        console.error("URL 복사 실패:", err);
      });
    setIsExtraOpen(false);
  };

  const handleReportProduct = withLoginRequired((e: React.MouseEvent) => {
    e.stopPropagation();
    const handleConfirm = async (
      selectedValue: string,
      reportContent: string
    ) => {
      if (reportProduct.isPending) return;
      try {
        reportProduct.mutate(
          {
            product_id: data.productId,
            reportType: selectedValue,
            content: reportContent,
          },
          {
            onSuccess: () => {
              setToast({
                message: "작품 신고가 완료되었습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "작품 신고에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      } catch (error) {
        setToast({
          message: "작품 신고에 실패했습니다.",
          type: "error",
        });
      }
    };
    setModal(
      <ReportModal
        reportType="product"
        reportOptions={[
          { value: "option1", label: "신고내용1" },
          { value: "option2", label: "신고내용2" },
          { value: "option3", label: "신고내용3" },
        ]}
        onConfirm={handleConfirm}
      />
    );
  });

  const handleSuggestionContract = () => {
    setOpenSuggestionModal(true);
  };

  const handleClickFirstOrContinueRead = () => {
    if (episodeCount === 0) {
      setConfirm({
        content: "열람 가능한 회차가 없습니다.",
        buttonCount: 1,
      });
      return;
    }

    // If user hasn't read any episode (latestEpisodeNo === 0), redirect to first episode
    // Otherwise, redirect to the latest read episode
    const targetEpisodeId = latestEpisodeNo === 0 ? firstEpisodeId : episodeId;

    if (targetEpisodeId) {
      router.push(
        buildViewerPath(targetEpisodeId, {
          productId: data.productId,
          entrySource,
        })
      );
    }
  };


  useEffect(() => {
    if (data?.synopsis) {
      setShowReadMore(data.synopsis.length > 98);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        extraMenuRef.current &&
        !extraMenuRef.current.contains(event.target as Node)
      ) {
        setIsExtraOpen(false);
      }
      if (
        synopsisRef.current &&
        !synopsisRef.current.contains(event.target as Node)
      ) {
        setIsSynopsisOpen(false);
      }
      if (
        interestTooltipRef.current &&
        !interestTooltipRef.current.contains(event.target as Node)
      ) {
        setIsInterestTooltipOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [data?.synopsis]);

  const renderInterestTooltipIcon = (src: string, alt: string) => {
    return (
      <button
        ref={interestTooltipRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isInterestTooltipOpen}
        className="relative flex justify-center items-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsInterestTooltipOpen((prev) => !prev);
        }}
      >
        <img
          src={src}
          alt={alt}
          width={20}
          height={26}
          className="w-[20px] h-[26px] md:w-[20px] md:h-[26px]"
        />
        {isInterestTooltipOpen && (
          <div className="absolute z-10 inline-block w-auto min-w-[240px] break-words rounded-[14px] bg-black-100 text-white leading-[15px] text-12pxr p-7pxr left-[-28px] top-full mt-2">
            <span className="block">{interestTooltipMessage}</span>
            <div className="absolute w-2 h-2 bg-black-100 rotate-45 left-[30px] -top-[3px]" />
          </div>
        )}
      </button>
    );
  };

  useEffect(() => {
    if (!isLoading && isSuccess && !data) {
      setConfirm({
        content: "존재하지 않는 작품입니다.",
        confirmText: "홈으로 이동",
        onConfirm: () => {
          router.push("/");
        },
        buttonCount: 1,
      });
    }
  }, [isLoading]);

  const renderButtonInterest = () => {
    if (
      !user ||
      !user.userId ||
      (data.interestStatus === "no_interest" && !data.badge?.interestEndDate)
    )
      return null;
    if (
      data.interestStatus === "no_interest" &&
      data.badge?.interestEndDate &&
      isEndDateExpired(data.badge.interestEndDate)
    ) {
      return renderInterestTooltipIcon("/images/fire-off.png", "관심 끊김");
    } else if (
      data.interestStatus === "interest_active" ||
      data.interestStatus === "interest_ending_soon"
    ) {
      return renderInterestTooltipIcon("/images/test/fire.svg", "관심 유지중");
    }
  };

  const renderPromotionBadgeOverlay = (className: string) => {
    if (!hasPromotionBadge) return null;

    return (
      <div className={className}>
        <SquareBadge
          type={promotionBadgeType}
          freeEpisodeNumber={data?.badge?.freeEpisodeTicketCount}
          timePassValue={data?.badge?.timepassFromTo}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="px-16pxr md:px-0 w-full max-w-[1120px] mx-auto">
        <button
          className="flex items-center gap-6pxr mt-0 md:mt-10pxr mb-15pxr"
          onClick={handleGoBack}
        >
          <Return className="w-[10px] md:w-[17px] md:h-[18px]" />
          <span className="text-13pxr md:text-15pxr">이전 페이지</span>
        </button>
      </div>
      <div className="md:hidden relative h-[230px] z-20">
        {!isLoading && data && (
          <>
            <img
              src={coverImagePath}
              alt={data.title}
              width={150}
              height={230}
              className={`object-cover min-w-[150px] h-[230px] rounded-[10px]`}
            />
            <AdultAgeBadge product={data} />
            {renderPromotionBadgeOverlay(
              "absolute flex bottom-[5px] left-[5px] gap-[2px]"
            )}
          </>
        )}
      </div>
      <div className="flex w-full max-w-[1200px] gap-[2px] mx-auto">
        <div
          className={`relative flex flex-col w-full min-h-[300px] md:min-h-[460px] bg-white p-25pxr md:p-40pxr mt-[-30px] md:mt-0 ${
            shouldShowRightPanel
              ? "md:max-w-[850px] md:rounded-l-[20px]"
              : "md:max-w-[1120px] md:rounded-[20px]"
          }`}
        >
          {isLoading && (
            <div className="w-full h-full flex justify-center items-center">
              <Spinner />
            </div>
          )}
          {!isLoading && data && (
            <>
              <div className="flex gap-30pxr">
                <div className="hidden md:block relative md:h-[220px] lg:h-[300px]">
                  <img
                    src={coverImagePath}
                    alt={data.title}
                    width={210}
                    height={300}
                    className={`object-cover md:min-w-[150px] lg:min-w-[210px] md:h-[220px] lg:h-[300px] rounded-[10px]`}
                  />
                  <AdultAgeBadge product={data} />
                  {renderPromotionBadgeOverlay(
                    "absolute flex bottom-[10px] left-[10px] gap-[2px]"
                  )}
                </div>
                <div
                  className={`flex flex-col items-center md:items-start gap-4pxr md:gap-10pxr w-full mt-30pxr ${
                    hasHeaderBadges ? "md:mt-0" : "md:mt-20pxr"
                  }`}
                >
                  <div className="flex items-center gap-2pxr flex-wrap">
                    {data.priceType && (
                      <SquareBadge type={data.priceType} size="header" />
                    )}
                    <ProductStateBadge product={data} badgeSize="header" />
                  </div>
                  <span className="text-21pxr md:text-25pxr lg:text-30pxr font-semibold md:leading-[29px] lg:leading-[35px]">
                    {data.title}
                  </span>
                  <div className="flex flex-col items-center md:items-start gap-2pxr md:gap-6pxr">
                    <div className="flex flex-wrap gap-5pxr md:gap-12pxr items-center">
                      <UserNickname
                        product={data as any}
                        userNickname={data.authorNickname || ""}
                        hasGle
                      />
                      {latestEpisodeDateLabel && (
                        <>
                          <div className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                          <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                            {latestEpisodeDateLabel}
                          </span>
                        </>
                      )}
                    </div>
                    {data.trendindex && data.properties && (
                      <>
                        <div className="flex items-center flex-wrap">
                          <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                            {/* 총 {data.trendindex?.hasEpisodeCount}화 */}총{" "}
                            {data.totalOpenEpisodeCount}화
                          </span>
                          <div className="w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" />
                          <span className="text-13pxr md:text-15pxr text-dark-gray-500">
                            {getUpdateFrequency(
                              data.properties?.updateFrequency || ""
                            )}
                          </span>
                        </div>
                        {user && (isAdminCPEditor || isAuthor) ? (
                          <div className="flex items-center justify-center md:justify-start gap-10pxr flex-wrap">
                            <div>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-200">
                                CP조회수
                              </span>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                                &nbsp;{data.trendindex?.cpHitCount || '-'}
                              </span>
                            </div>
                            <div className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                            <div>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-200">
                                연독률
                              </span>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                                &nbsp;
                                {data.trendindex?.readThroughRate ? `${Number(data.trendindex.readThroughRate).toFixed(1)}%` : '-'}
                              </span>
                            </div>
                            <div className="w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                            <div>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-200">
                                주평균 연재횟수
                              </span>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                                &nbsp;{data.properties?.averageWeeklyEpisodes != null ? Number(data.properties.averageWeeklyEpisodes).toFixed(1) : '-'}
                              </span>
                            </div>
                            <div className="hidden md:block w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                            <div className="hidden md:block">
                              <span className="text-13pxr md:text-14pxr text-dark-gray-200">
                                주요독자층
                              </span>
                              <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                                &nbsp;
                                {data.trendindex?.primaryReaderGroup?.["1"] ??
                                  ""}
                                ,&nbsp;
                                {data.trendindex?.primaryReaderGroup?.["2"] ??
                                  ""}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                  {data.trendindex && (
                    <div className="flex gap-7pxr md:gap-15pxr md:mt-15pxr items-center">
                      {user && (isAdminCPEditor || isAuthor) && (
                        <>
                          <div className="md:hidden">
                            <span className="text-13pxr md:text-14pxr text-dark-gray-200">
                              주요독자층
                            </span>
                            <span className="text-13pxr md:text-14pxr text-dark-gray-500">
                              &nbsp;
                              {data.trendindex?.primaryReaderGroup?.["1"] ?? ""}
                              ,&nbsp;
                              {data.trendindex?.primaryReaderGroup?.["2"] ?? ""}
                            </span>
                          </div>
                          <div className="md:hidden w-[1px] h-[10px] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
                        </>
                      )}
                      {user && (isAdminCPEditor || isAuthor) && (
                        <>
                          <div className="flex items-center gap-5pxr">
                            <View className="w-[16px] h-[15px] text-dark-gray-400" />
                            <span className="text-13pxr text-dark-gray-400">
                              {formatKoreanNumber(data.trendindex?.hitCount || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-5pxr">
                            <ThumbsUp className="w-[18px] h-[15px] mr-[-3px]" />
                            <span className="text-13pxr text-dark-gray-400">
                              {formatKoreanNumber(
                                data.trendindex?.recommendCount || 0
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-5pxr">
                            <Bookmark className="w-[13px] h-[15px] text-dark-gray-400" />
                            <span className="text-13pxr text-dark-gray-400">
                              {formatKoreanNumber(
                                data.trendindex?.bookmarkCount || 0
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div
                    className={`relative max-w-[530px] mt-10pxr`}
                    ref={synopsisRef}
                  >
                    <span
                      className={`${data.trendindex ? "line-clamp-2" : ""}`}
                    >
                      {data?.synopsis
                        ?.split("\\n")
                        .map((paragraph: any, index: number) => (
                          <p
                            key={index}
                            className="text-14pxr md:text-15pxr text-dark-gray-400 mb-4pxr"
                          >
                            {paragraph}
                          </p>
                        ))}
                    </span>
                    {showReadMore && data.trendindex && (
                      <div className="absolute right-0 flex items-center gap-5pxr mt-2pxr">
                        <button
                          className="text-14pxr"
                          onClick={() => setIsSynopsisOpen(!isSynopsisOpen)}
                        >
                          더보기
                        </button>
                        <ArrowDown className="w-[10px] h-[10px] text-dark-gray-300" />
                      </div>
                    )}
                    {isSynopsisOpen && (
                      <div className="absolute top-[99px] left-[-10px] inset-0 z-50 flex items-center justify-center w-[105%] md:w-[110%]">
                        <div className="relative bg-white border border-light-gray-200 rounded-[10px] shadow-sm">
                          <div className="relative p-4 w-[100%] h-[200px] overflow-auto">
                            <div className="text-14pxr md:text-15pxr text-dark-gray-400">
                              {data.synopsis
                                ?.split("\\n")
                                .map((paragraph: any, index: number) => (
                                  <p key={index} className="mb-4pxr">
                                    {paragraph}
                                  </p>
                                ))}
                            </div>
                          </div>
                          <div className="flex w-full justify-end items-center gap-5pxr h-[30px] py-5pxr pr-10pxr border border-t-light-gray-200 border-b-0 border-l-0 border-r-0 bg-[#FAFAFA] rounded-b-[10px]">
                            <button
                              className="text-14pxr"
                              onClick={() => setIsSynopsisOpen(!isSynopsisOpen)}
                            >
                              접기
                            </button>
                            <ArrowDown
                              className={`w-[10px] h-[10px] text-dark-gray-300 rotate-180`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {!isLoading && data && (
            <>
              <div className="flex justify-between items-center max-w-[770px] mt-25pxr">
                <div className="flex flex-wrap max-w-[400px] gap-5pxr mt-14pxr">
                  {data.keywords?.map((keyword: any, index: number) => (
                    <div
                      key={index}
                      className="bg-light-gray-100 rounded-[100px] text-13pxr text-dark-gray-400 min-w-[50px] px-12pxr py-4pxr"
                    >
                      #{keyword}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-8pxr flex-wrap">
                  <div className="hidden md:flex w-[240px] flex-col gap-8pxr">
                    <Button
                      variant="primary"
                      size="xl"
                      className="w-full h-auto py-10pxr"
                      onClick={() => {
                        handleClickFirstOrContinueRead();
                      }}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="text-16pxr font-bold tracking-[-2%]">
                          {latestEpisodeNo !== 0 ? "이어보기" : "첫회 보기"}
                        </span>
                        <span className="text-12pxr font-normal opacity-80 truncate max-w-[170px]">
                          {latestEpisodeNo !== 0
                            ? (latestEpisodeTitle || "")
                            : (firstEpisodeTitle || "")}
                        </span>
                      </div>
                    </Button>
                    {shouldShowWebsochatEntryCta ? (
                      <WebsochatEntryCtas
                        productId={data.productId}
                        productTitle={data.title}
                        authorNickname={data.authorNickname}
                        coverImagePath={coverImagePath}
                        priceType={data.priceType}
                        publishedLatestEpisodeNo={data.latestEpisodeNo}
                        syncedLatestEpisodeNo={data.syncedLatestEpisodeNo}
                        contextStatus={websochatContextStatus}
                        isLoggedIn={!!user?.userId}
                      />
                    ) : null}
                  </div>
                  {isShowButtonProposal && (
                    <Button
                      variant="secondary"
                      size="xl"
                      className="hidden md:block w-[150px]"
                      onClick={handleSuggestionContract}
                    >
                      계약제안
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex md:hidden mt-30pxr gap-5pxr">
                <div className={`${isShowButtonProposal ? "w-[70%]" : "w-full"} flex flex-col gap-5pxr`}>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full h-auto py-8pxr"
                    onClick={() => {
                      handleClickFirstOrContinueRead();
                    }}
                  >
                    <div className="flex flex-col items-center w-full">
                      <span className="text-14pxr font-bold tracking-[-2%]">
                        {latestEpisodeNo !== 0 ? "이어보기" : "첫회 보기"}
                      </span>
                      <span className="text-11pxr font-normal opacity-80 truncate max-w-full">
                        {latestEpisodeNo !== 0
                          ? (latestEpisodeTitle || "")
                          : (firstEpisodeTitle || "")}
                      </span>
                    </div>
                  </Button>
                  {shouldShowWebsochatEntryCta ? (
                    <>
                      <WebsochatEntryCtas
                        productId={data.productId}
                        productTitle={data.title}
                        authorNickname={data.authorNickname}
                        coverImagePath={coverImagePath}
                        priceType={data.priceType}
                        publishedLatestEpisodeNo={data.latestEpisodeNo}
                        syncedLatestEpisodeNo={data.syncedLatestEpisodeNo}
                        contextStatus={websochatContextStatus}
                        isLoggedIn={!!user?.userId}
                      />
                      <WebsochatMiniPreview
                        productId={data.productId}
                        productTitle={data.title}
                        authorNickname={data.authorNickname}
                        coverImagePath={coverImagePath}
                        priceType={data.priceType}
                        adultYn={data.adultYn}
                        publishedLatestEpisodeNo={data.latestEpisodeNo}
                        syncedLatestEpisodeNo={data.syncedLatestEpisodeNo}
                        contextStatus={websochatContextStatus}
                        isLoggedIn={!!user?.userId}
                        defaultOpen={false}
                        className="mt-8pxr"
                      />
                    </>
                  ) : shouldShowWebsochatUnavailable ? (
                    <div className="mt-8pxr rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-14pxr py-12pxr text-center">
                      <p className="text-13pxr font-medium leading-[1.5] tracking-[-2%] text-dark-gray-400">
                        {websochatLaunchEligibility.unavailableMessage}
                      </p>
                    </div>
                  ) : null}
                </div>
                {isShowButtonProposal && (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-[30%]"
                    onClick={handleSuggestionContract}
                  >
                    계약제안
                  </Button>
                )}
              </div>
              <div className="absolute top-[-235px] md:top-[20px] right-[10px] flex gap-10pxr">
                {renderButtonInterest()}
                <BookmarkButton
                  productId={data.productId}
                  bookmarkYn={data.properties?.bookmarkYn || "N"}
                  buttonStyle=""
                  bookmarkStyle="w-[20px] h-[25px] text-dark-gray-200 hover:text-dark-gray-500"
                  activeBookmarkStyle="w-[20px] h-[25px]"
                />
                <button
                  className="text-dark-gray-100 hover:text-dark-gray-500 p-2"
                  onClick={() => {
                    setIsExtraOpen(!isExtraOpen);
                  }}
                >
                  <Another className="w-[3px] h-[15px]" />
                </button>
              </div>
            </>
          )}
          {isExtraOpen && (
            <div
              className="absolute right-[20px] md:right-[-55px] top-[-200px] md:top-[45px] flex flex-col bg-white border border-light-gray-500 rounded-[8px] z-10"
              ref={extraMenuRef}
            >
              {/* TODO: 신고 모달 추가 */}
              <button
                className="text-14pxr px-[9px] py-[10px] hover:bg-light-gray-100"
                onClick={handleReportProduct}
              >
                신고
              </button>
              <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
              <button
                className="text-14pxr px-[9px] py-[10px] hover:bg-light-gray-100"
                onClick={copyToClipboard}
              >
                URL 복사
              </button>
            </div>
          )}
        </div>
        {shouldShowWebsochatEntryCta ? (
          <div className="hidden md:flex w-[327px] shrink-0 items-stretch justify-center bg-white rounded-r-[20px] px-18pxr py-20pxr">
            <WebsochatMiniPreview
              productId={data.productId}
              productTitle={data.title}
              authorNickname={data.authorNickname}
              coverImagePath={coverImagePath}
              priceType={data.priceType}
              adultYn={data.adultYn}
              publishedLatestEpisodeNo={data.latestEpisodeNo}
              syncedLatestEpisodeNo={data.syncedLatestEpisodeNo}
              contextStatus={websochatContextStatus}
              isLoggedIn={!!user?.userId}
              defaultOpen
              collapsible={false}
              className="h-full min-h-[430px] w-full min-w-[270px]"
            />
          </div>
        ) : shouldShowEvaluationContainer ? (
          <div className="hidden md:flex min-w-[327px] justify-center bg-white rounded-r-[20px] pb-[20px] lg:pb-0">
            <div className="min-w-[270px]">
              <div className="flex gap-10pxr items-center mt-30pxr mb-15pxr">
                <span className="text-20pxr font-semibold">평가</span>
                <div className="h-[12px] border border-t-0 border-b-0 border-l-light-gray-500 border-r-0" />
                <div>
                  <span className="text-13pxr text-dark-gray-300">총</span>
                  <span className="text-13pxr text-primary-100 font-semibold">
                    &nbsp;
                    {evaluations
                      ? Object.values(evaluations).reduce(
                          (total, count) => total + count,
                          0
                        )
                      : 0}
                    명&nbsp;
                  </span>
                  <span className="text-13pxr text-dark-gray-300">참여 중</span>
                </div>
              </div>
              {evaluations && <ProductReaction evaluations={evaluations} />}
            </div>
          </div>
        ) : shouldShowWebsochatUnavailable ? (
          <div className="hidden md:flex w-[327px] shrink-0 items-center justify-center bg-white rounded-r-[20px] px-24pxr">
            <p className="text-center text-14pxr font-medium leading-[1.5] tracking-[-2%] text-dark-gray-300">
              {websochatLaunchEligibility.unavailableMessage}
            </p>
          </div>
        ) : null}
      </div>
      {shouldShowEvaluationContainer && (
        <div className="md:hidden flex w-full justify-center bg-white px-16pxr">
          <div className="w-full ">
            <div className="flex gap-10pxr items-center mt-30pxr mb-15pxr">
              <span className="text-18pxr font-semibold">평가</span>
              <div className="h-[12px] border border-t-0 border-b-0 border-l-light-gray-500 border-r-0" />
              <div>
                <span className="text-13pxr text-dark-gray-300">총</span>
                <span className="text-13pxr text-primary-100 font-semibold">
                  &nbsp;
                  {evaluations
                    ? Object.values(evaluations).reduce(
                        (total, count) => total + count,
                        0
                      )
                    : 0}
                  명&nbsp;
                </span>
                <span className="text-13pxr text-dark-gray-300">참여 중</span>
              </div>
            </div>
            {evaluations && <ProductReaction evaluations={evaluations} />}
          </div>
        </div>
      )}
      <Modal size="sm" />
      <SuggestionModal
        isOpen={openSuggestionModal}
        setIsOpen={setOpenSuggestionModal}
        onClose={() => setOpenSuggestionModal(false)}
        title={data?.title}
        productId={data?.productId}
      />
    </div>
  );
};
export default ProductCoverArea;

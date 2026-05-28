import { useSelectEpisodes } from "@/app/api/query/episode";
import { ISelectEpisodeObject } from "@/app/api/query/episode/dto";
import { useGetAvailableTickets } from "@/app/api/query/product";
import { useQueryClient } from "@tanstack/react-query";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import { INotice } from "@/types";
import { formatKoreanNumber } from "@/utils/formatKoreanNumber";
import { getEpisodeBadge } from "@/utils/getEpisodeBadge";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { buildEpisodeSummaryLabel } from "@/utils/episodeSummaryLabel";
import type { ProductDetailEntrySource } from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";
import MoreReadButton from "../common/MoreReadButton";
import SquareBadge from "../common/SquareBadge";
import ProductNotice from "./ProductNotice";
import ArrowUpDown from "/public/images/arrow-up-down.svg";
import Clock from "/public/images/clock.svg";
import Rating from "/public/images/rating.svg";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import View from "/public/images/view.svg";

const PAGE_SIZE = 25;

interface Props {
  priceType?: "free" | "paid";
  episodeCount?: number;
  paidEpisodeNo?: number | null;
  productId: number;
  productTitle?: string;
  authorId?: number;
  notices: INotice[];
  waitForFreeYn?: "Y" | "N";
  entrySource?: ProductDetailEntrySource | null;
}

const ProductEpisodes = ({
  episodeCount,
  paidEpisodeNo,
  priceType,
  productId,
  productTitle,
  authorId,
  notices,
  waitForFreeYn,
  entrySource,
}: Props) => {
  const router = useRouter();
  const { withLoginRequired } = useAuthWrapper();
  const { user, accessToken, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
  }));
  const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
  const showWaitForFreeCard = waitForFreeYn === "Y" && canUseUserScope;
  const isAuthor =
    !!user?.userId && !!authorId && user.userId === authorId;
  const isAdminCPEditor =
    user?.userRole === "CP" ||
    user?.userRole === "editor" ||
    user?.userRole === "admin";
  const canSeeEpisodeStats = !!user && (isAuthor || isAdminCPEditor);
  const { setTypeModal } = useModalStore();
  const [isDescSort, setIsDescSort] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const episodeSummaryLabel = buildEpisodeSummaryLabel({
    totalEpisodeCount: episodeCount,
    productPriceType: priceType,
    paidEpisodeNo,
  });

  // 기다무 대여권 수 조회 (React Query가 ButtonBottom 호출과 중복 제거)
  const { data: ticketsData } = useGetAvailableTickets({
    product_id: showWaitForFreeCard ? productId : undefined,
  });
  const wffTicketCount = ticketsData?.count_by_type?.waiting_for_free || 0;
  const wffNextChargeAt = ticketsData?.wff_next_charge_at ?? null;

  // 기다무 충전 카운트다운 타이머 (게이지)
  const queryClient = useQueryClient();
  const [wffTimeRemaining, setWffTimeRemaining] = useState<string | null>(null);
  const [wffProgress, setWffProgress] = useState(0);
  useEffect(() => {
    if (!wffNextChargeAt || wffTicketCount > 0) {
      setWffTimeRemaining(null);
      setWffProgress(0);
      return;
    }

    const targetTime = new Date(wffNextChargeAt).getTime();
    const totalMs = 24 * 60 * 60 * 1000;

    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setWffTimeRemaining(null);
        setWffProgress(100);
        clearInterval(interval);
        queryClient.invalidateQueries({ queryKey: ["getEpisodeList"] });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setWffTimeRemaining(`${hours}시간 ${String(minutes).padStart(2, '0')}분 ${String(seconds).padStart(2, '0')}초`);
      setWffProgress(Math.min(((totalMs - diff) / totalMs) * 100, 100));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [wffNextChargeAt, wffTicketCount, queryClient]);

  const { data: episodes, fetchNextPage } = useSelectEpisodes(
    productId,
    canUseUserScope ? user?.userId || null : null,
    1,
    PAGE_SIZE,
    "episodeNo",
    isDescSort ? "desc" : "asc"
  );

  const allEpisodes = useMemo(() => {
    if (!episodes) return [];
    return episodes?.pages.map((page) => page.data.episodes).flat();
  }, [episodes]);

  const visibleEpisodes = useMemo(() => {
    return allEpisodes.slice(0, visibleCount);
  }, [allEpisodes, visibleCount]);

  const latestEpisodeId = useMemo(() => {
    if (allEpisodes.length === 0) return null;
    return allEpisodes.reduce((latest, current) => {
      if (!latest) return current;
      return (current.episodeNo || 0) > (latest.episodeNo || 0)
        ? current
        : latest;
    }, null as ISelectEpisodeObject | null)?.episodeId ?? null;
  }, [allEpisodes]);

  const handleLoadMore = () => {
    const newCount = visibleCount + PAGE_SIZE;
    setVisibleCount(newCount);

    // Fetch more from API if we're approaching the end of current data
    if (newCount >= allEpisodes.length - 5) {
      fetchNextPage();
    }
  };

  const handleClickEpisode = (episode: ISelectEpisodeObject) => {
    const viewerPath = buildViewerPath(episode.episodeId, {
      productId,
      entrySource,
    });

    if (!isAuthenticated && (episode.priceType === "paid" || (episode.episodeNo || 0) > 5)) {
      withLoginRequired(() => undefined, {
        redirectPath: viewerPath,
        resumeContext: {
          productId,
          originPageType: "product_detail",
        },
      })?.();
      return;
    }

    // For paid episodes, check rental tickets
    if (
      episode.priceType === "paid" &&
      (!episode.rentalRemaining ||
        (episode.rentalRemaining?.days === 0 &&
          episode.rentalRemaining?.hours === 0)) &&
      episode.ownType !== "own"
    ) {
      setTypeModal(TYPE_MODAL.RENT_OWN, {
        title: `${productTitle} ${episode.episodeNo}화`,
        episodeId: episode.episodeId,
        productId: productId,
        episodeTitle: episode.episodeTitle,
        entrySource,
      });
      return;
    }

    // Free episode or has rental tickets - go to viewer
    router.push(viewerPath);
  };

  return (
    <div className="flex flex-col px-16pxr md:px-0">
      <div className="flex justify-between mt-30pxr md:mt-0 mb-18pxr">
        <div className="flex flex-col gap-3pxr">
          <span className="text-18pxr md:text-22pxr font-bold">작품 회차</span>
          <span className="text-12pxr md:text-14pxr text-dark-gray-400">
            {episodeSummaryLabel}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-[100px] md:w-[110px]"
          onClick={() => setIsDescSort(!isDescSort)}
        >
          <ArrowUpDown className="w-[11px] md:w-[13px] h-[12px]" />
          <span className="ml-5pxr text-12pxr md:text-14pxr text-dark-gray-500">
            {isDescSort ? "최신회부터" : "첫회부터"}
          </span>
        </Button>
      </div>
      {showWaitForFreeCard && (
        <div className="bg-[#F5FAFD] rounded-[10px] min-h-[57px] md:min-h-[62px] py-16pxr">
          <div className="relative flex items-center justify-between pl-50pxr pr-16pxr">
            <div className="flex items-center">
              <Clock className="absolute left-[15px] top-1/2 w-[20px] h-[20px] -translate-y-1/2 text-[#52CFF8]" />
              <span className="text-13pxr md:text-[0.9rem] font-normal text-dark-gray-500 tracking-[-2%]">
                기다무 대여권{" "}
                <span className="text-[#52CFF8] font-bold">
                  {wffTicketCount}장
                </span>
              </span>
            </div>
            {wffTimeRemaining && (
              <span className="text-12pxr md:text-13pxr font-normal text-dark-gray-400 tracking-[-2%]">
                {wffTimeRemaining} 남음
              </span>
            )}
          </div>
          {wffTimeRemaining && (
            <div className="h-[6px] bg-light-gray-300 rounded-full overflow-hidden mx-16pxr mt-6pxr">
              <div
                className="h-full bg-[#52CFF8] rounded-full transition-all duration-500"
                style={{ width: `${wffProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      <div className={showWaitForFreeCard ? "mt-16pxr" : ""}>
        <ProductNotice
          notices={notices}
          productTitle={productTitle}
          productId={productId}
        />
      </div>
      <div className="relative flex flex-col gap-10pxr mt-16pxr">
        {visibleEpisodes.length < 1 ? (
          <div className="mt-20pxr">
            <span className="text-13pxr md:text-16pxr text-dark-gray-400">
              등록된 회차가 없습니다.
            </span>
          </div>
        ) : (
          <>
            {visibleEpisodes.map((episode) => {
                const displayDate =
                  episode.openChangedDate || episode.createdDate || "";
                const isLatestEpisode = episode.episodeId === latestEpisodeId;
                const showUpBadge =
                  isLatestEpisode && getIsNewEpisode(displayDate);

                return (
              <div
                key={episode.episodeId}
                className="relative flex items-center min-h-[57px] md:min-h-[62px] border border-light-gray-400 rounded-[10px] cursor-pointer hover:shadow-md"
                onClick={() => {
                  handleClickEpisode(episode);
                }}
              >
                {episode.usage ? (
                  <div
                    className={`absolute w-[13px] h-full rounded-l-[10px] ${
                      episode.usage.readYn === "Y"
                        ? "bg-[#57D6FF]"
                        : "bg-light-gray-200"
                    }`}
                  />
                ) : (
                  <div
                    className={`absolute w-[13px] h-full rounded-l-[10px] bg-light-gray-200`}
                  />
                )}
                <div className="flex justify-between items-center w-full min-h-[55px] md:min-h-[60px] py-6pxr md:py-3pxr px-15pxr ml-10pxr">
                  <div className="flex flex-col flex-1 min-w-0 pr-10pxr">
                    <div className="flex items-center gap-8pxr min-w-0">
                      <span className="shrink-0">
                        <SquareBadge
                          type={
                            getEpisodeBadge(episode) as
                              | "free"
                              | "paid"
                              | "rental"
                              | "collect"
                          }
                          size="small"
                        />
                      </span>
                      {waitForFreeYn === "Y" &&
                        getEpisodeBadge(episode) === "paid" && (
                          <span className="shrink-0">
                            <SquareBadge
                              type={["waitForFree"]}
                              size="small"
                            />
                          </span>
                        )}
                      <span className="min-w-0 shrink text-13pxr md:text-[0.9rem] font-normal line-clamp-2">
                        {episode.episodeTitle}
                      </span>
                      {showUpBadge && (
                        <span className="shrink-0">
                          <SquareBadge type="up" size="small" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-7pxr ml-32pxr">
                      <div className="flex gap-10pxr">
                        <div className="text-11pxr md:text-12pxr text-dark-gray-400">
                          <span>
                            {displayDate
                              ? getFormattingDate(
                                  displayDate,
                                  "YYYY.MM.DD"
                                )
                              : ""}
                          </span>
                          <span className="ml-2 text-gray-300">|</span>
                        </div>
                        {canSeeEpisodeStats && (
                          <>
                            <div className="flex items-center gap-3pxr">
                              <View className="w-[14px] h-[12px] text-dark-gray-300" />
                              <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                                {formatKoreanNumber(episode.countHit)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3pxr">
                              <ThumbsUp className="w-[15px] h-[12px]" />
                              <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                                {formatKoreanNumber(episode.countRecommend)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3pxr">
                              <Image
                                src={"/images/message-gray.svg"}
                                width={14}
                                height={14}
                                alt="comment"
                              />
                              <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                                {formatKoreanNumber(episode.countComment)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3pxr">
                              <Rating className="w-[14px] h-[14px] text-dark-gray-300" />
                              <span className="text-11pxr md:text-13pxr text-dark-gray-400">
                                {formatKoreanNumber(episode.countEvaluation)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* TODO: 대여 및 소장 데이터가 확립되면 주석 제거 */}
                    <div className="md:hidden flex gap-30pxr ml-32pxr">
                      {episode.rentalRemaining && (
                        <div className="flex items-center gap-5pxr">
                          <Clock className="w-[12px] h-[12px] text-dark-gray-100" />
                          <span className="text-11pxr text-dark-gray-200">
                            대여
                          </span>
                          <span className="text-11pxr text-dark-gray-500">
                            {episode.rentalRemaining.days}일&nbsp;
                            {episode.rentalRemaining.hours}
                            시간&nbsp;남음
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden md:flex shrink-0 gap-30pxr mr-10pxr">
                    {/* TODO: 대여 및 소장 데이터가 확립되면 주석 제거 */}
                    {episode.rentalRemaining && (
                      <div className="flex items-center gap-5pxr">
                        <Clock className="w-[18px] h-[18px] text-dark-gray-100" />
                        <span className="text-14pxr text-dark-gray-200">
                          대여
                        </span>
                        <span className="text-14pxr text-dark-gray-500">
                          {episode.rentalRemaining.days}일&nbsp;
                          {episode.rentalRemaining.hours}
                          시간&nbsp;남음
                        </span>
                      </div>
                    )}
                    <span className="text-14pxr text-dark-gray-300">
                      {!isAuthenticated && (episode.episodeNo || 0) > 5
                        ? "로그인 필요"
                        : `${episode.episodeTextCount}자`}
                    </span>
                  </div>
                  </div>
                </div>
                );
              })}
          </>
        )}
        {visibleCount < (episodeCount || 0) && (
          <div className="absolute bottom-[0px] w-full flex items-end justify-center h-[100px] bg-gradient-to-t from-white to-transparent">
            <MoreReadButton onClick={handleLoadMore} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductEpisodes;

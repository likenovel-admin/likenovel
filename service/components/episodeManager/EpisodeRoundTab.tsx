import {
  useCancelReserveEpisode,
  useCreateAuthorEpisodePrediction,
  useOpenEpisode,
} from "@/app/api/query/author/episode";
import { SHOW_PRODUCT_EVALUATION_SURFACE } from "@/constants/common";
import useToastStore from "@/store/toastStore";
import { IEpisode } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../common/Button";
import CheckBox from "../common/CheckBox";
import RoundBadge from "../common/RoundBadge";
import SimpleMenu from "../common/SimpleMenu";
import BulkReserveModal from "./BulkReserveModal";
import ArrowUpDown from "/public/images/arrow-up-down.svg";
import Rating from "/public/images/rating.svg";
import View from "/public/images/view.svg";

interface EpisodeRoundTabProps {
  episodes: IEpisode[];
  productId: number;
  productPriceType?: "free" | "paid";
  productType?: "free" | "normal" | "paid";
  updateFrequency?: string;
}

const WEEKLY_UPLOAD_GOAL = 5;
const RECENT_EPISODE_SAMPLE_SIZE = 12;
const MIN_EPISODE_SAMPLE_SIZE = 8;

const getWeekStart = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - mondayOffset);
  return result;
};

const getSafeDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRankGainRange = (expectedViews: number): [number, number] => {
  if (expectedViews >= 5000) return [4, 8];
  if (expectedViews >= 2500) return [3, 6];
  if (expectedViews >= 1200) return [2, 4];
  if (expectedViews >= 500) return [1, 3];
  return [0, 1];
};

const getTargetWeeklyUploads = (updateFrequency?: string): number => {
  if (!updateFrequency) return 0;
  try {
    const parsed = JSON.parse(updateFrequency) as Record<string, string>;
    return Object.values(parsed).filter((value) => value === "Y").length;
  } catch {
    return 0;
  }
};

const EpisodeRoundTab = ({
  episodes,
  productId,
  productPriceType,
  productType,
  updateFrequency,
}: EpisodeRoundTabProps) => {
  const [isDescSort, setIsDescSort] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [isBulkReserveModalOpen, setIsBulkReserveModalOpen] = useState(false);
  const predictionLogKeyRef = useRef("");
  const { mutate: createPredictionLog } = useCreateAuthorEpisodePrediction();

  const weeklyInsight = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);

    const uploadsThisWeek = episodes.filter((episode) => {
      const createdDate = getSafeDate(episode.createdDate);
      if (!createdDate) return false;
      return createdDate >= weekStart && createdDate <= now;
    }).length;

    const targetWeeklyUploads = getTargetWeeklyUploads(updateFrequency);
    const remainingTargetUploads =
      targetWeeklyUploads > 0 ? Math.max(0, targetWeeklyUploads - uploadsThisWeek) : 0;
    const remainingRecommendedUploads = Math.max(
      0,
      WEEKLY_UPLOAD_GOAL - uploadsThisWeek
    );
    const predictionBaseUploads =
      targetWeeklyUploads > 0
        ? remainingTargetUploads === 0
          ? 1
          : remainingTargetUploads
        : remainingRecommendedUploads === 0
        ? 1
        : remainingRecommendedUploads;

    const recentEpisodes = [...episodes]
      .filter((episode) => getSafeDate(episode.createdDate))
      .sort(
        (a, b) =>
          (getSafeDate(b.createdDate)?.getTime() ?? 0) -
          (getSafeDate(a.createdDate)?.getTime() ?? 0)
      )
      .slice(0, RECENT_EPISODE_SAMPLE_SIZE);

    if (recentEpisodes.length < MIN_EPISODE_SAMPLE_SIZE) {
      return {
        uploadsThisWeek,
        targetWeeklyUploads,
        remainingTargetUploads,
        remainingRecommendedUploads,
        predictionBaseUploads,
        sampleEpisodeCount: recentEpisodes.length,
        sampleWindowType:
          recentEpisodes.length >= RECENT_EPISODE_SAMPLE_SIZE
            ? "recent_12"
            : "recent_8",
        hasEnoughData: false,
        expectedViewsMin: 0,
        expectedViewsMax: 0,
        rankGainMin: 0,
        rankGainMax: 0,
      };
    }

    const avgViews = Math.round(
      recentEpisodes.reduce((sum, episode) => sum + (episode.countView || 0), 0) /
        recentEpisodes.length
    );

    const cadenceWeight =
      uploadsThisWeek >= WEEKLY_UPLOAD_GOAL
        ? 1.1
        : uploadsThisWeek >= 3
        ? 1
        : 0.9;

    const expectedPerEpisode = Math.max(
      80,
      Math.round(avgViews * 0.08 * cadenceWeight)
    );
    const expectedViewsMin = expectedPerEpisode * predictionBaseUploads;
    const expectedViewsMax = Math.round(expectedViewsMin * 1.35);
    const [rankGainMin, rankGainMax] = getRankGainRange(expectedViewsMin);

    return {
      uploadsThisWeek,
      targetWeeklyUploads,
      remainingTargetUploads,
      remainingRecommendedUploads,
      predictionBaseUploads,
      sampleEpisodeCount: recentEpisodes.length,
      sampleWindowType:
        recentEpisodes.length >= RECENT_EPISODE_SAMPLE_SIZE
          ? "recent_12"
          : "recent_8",
      hasEnoughData: true,
      expectedViewsMin,
      expectedViewsMax,
      rankGainMin,
      rankGainMax,
    };
  }, [episodes, updateFrequency]);

  const sortedEpisodes = useMemo(() => {
    const sorted = [...episodes];
    if (isDescSort) {
      return sorted.sort((a, b) => b.episodeNo - a.episodeNo);
    }
    return sorted.sort((a, b) => a.episodeNo - b.episodeNo);
  }, [episodes, isDescSort]);

  const isBulkReserveEnabled =
    productPriceType === "free" && productType === "normal";

  const selectedEpisodes = useMemo(
    () =>
      episodes
        .filter((episode) => selectedEpisodeIds.includes(episode.episodeId))
        .sort((a, b) => a.episodeNo - b.episodeNo),
    [episodes, selectedEpisodeIds]
  );

  const resetSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedEpisodeIds([]);
  };

  const toggleEpisodeSelection = (episodeId: number) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedEpisodeIds([]);
      return;
    }

    const currentEpisodeIds = new Set(episodes.map((episode) => episode.episodeId));
    setSelectedEpisodeIds((prev) => prev.filter((id) => currentEpisodeIds.has(id)));
  }, [episodes, isSelectionMode]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("ko-KR").format(value);

  useEffect(() => {
    if (!episodes.length) return;

    const productId = episodes[0]?.productId;
    if (!productId) return;

    const weekStartDate = getWeekStart(new Date());
    const weekStartDateStr = weekStartDate.toISOString().slice(0, 10);
    const predictionBasis =
      weeklyInsight.targetWeeklyUploads > 0 ? "target_goal" : "recommended_goal";
    const sentKey = [
      productId,
      weekStartDateStr,
      weeklyInsight.uploadsThisWeek,
      weeklyInsight.targetWeeklyUploads,
      weeklyInsight.predictionBaseUploads,
      weeklyInsight.hasEnoughData ? "Y" : "N",
    ].join(":");

    if (predictionLogKeyRef.current === sentKey) return;
    predictionLogKeyRef.current = sentKey;

    createPredictionLog({
      product_id: productId,
      screen_name: "author_episode_manager",
      target_week_start_date: weekStartDateStr,
      target_weekly_upload_goal: weeklyInsight.targetWeeklyUploads,
      recommended_weekly_upload_goal: WEEKLY_UPLOAD_GOAL,
      uploads_this_week: weeklyInsight.uploadsThisWeek,
      remaining_target_uploads: weeklyInsight.remainingTargetUploads,
      remaining_recommended_uploads: weeklyInsight.remainingRecommendedUploads,
      prediction_base_uploads: weeklyInsight.predictionBaseUploads,
      sample_episode_count: weeklyInsight.sampleEpisodeCount,
      sample_window_type: weeklyInsight.sampleWindowType,
      prediction_basis: predictionBasis,
      expected_views_min: weeklyInsight.expectedViewsMin,
      expected_views_max: weeklyInsight.expectedViewsMax,
      expected_rank_gain_min: weeklyInsight.rankGainMin,
      expected_rank_gain_max: weeklyInsight.rankGainMax,
      has_enough_data: weeklyInsight.hasEnoughData ? "Y" : "N",
      model_version: "v1.0.0",
      prediction_key:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${productId}-${Date.now()}`,
    });
  }, [createPredictionLog, episodes, weeklyInsight]);

  return (
    <div>
      <div className="flex gap-2 justify-center items-start pt-5 pb-2 border-b mb-6">
        <Image
          src="/images/megaphone.svg"
          alt="insight"
          width={22}
          height={19}
        />
        <div className="text-gray-600">
          <p className="text-13pxr md:text-16pxr font-semibold">
            {weeklyInsight.targetWeeklyUploads > 0
              ? `이번 주 목표연재주기 ${weeklyInsight.uploadsThisWeek}/${weeklyInsight.targetWeeklyUploads}`
              : "이번 주 목표연재주기 미설정(비정기)"}
          </p>
          <p className="text-12pxr md:text-14pxr mt-1">
            {weeklyInsight.targetWeeklyUploads > 0
              ? weeklyInsight.remainingTargetUploads > 0
                ? `${weeklyInsight.remainingTargetUploads}화 더 업로드하면 목표연재주기를 달성해요.`
                : "이번 주 목표연재주기를 달성했어요."
              : "비정기 작품으로 설정되어 있어요."}
          </p>
          <p className="text-12pxr md:text-14pxr mt-1">
            {weeklyInsight.hasEnoughData
              ? weeklyInsight.predictionBaseUploads > 1
                ? `${
                    weeklyInsight.targetWeeklyUploads > 0
                      ? "목표연재주기 기준"
                      : "권장 주기 기준"
                  }으로 ${weeklyInsight.predictionBaseUploads}화 더 업로드하면 예상 추가 조회수 +${formatNumber(
                    weeklyInsight.expectedViewsMin
                  )}~+${formatNumber(
                    weeklyInsight.expectedViewsMax
                  )}, 예상 순위 상승 +${weeklyInsight.rankGainMin}~+${weeklyInsight.rankGainMax}위`
                : `${
                    weeklyInsight.targetWeeklyUploads > 0
                      ? "목표연재주기 기준"
                      : "권장 주기 기준"
                  }으로 지금 1화 더 업로드하면 예상 추가 조회수 +${formatNumber(
                    weeklyInsight.expectedViewsMin
                  )}~+${formatNumber(
                    weeklyInsight.expectedViewsMax
                  )}, 예상 순위 상승 +${weeklyInsight.rankGainMin}~+${weeklyInsight.rankGainMax}위`
              : "예측 데이터가 부족해요. 최근 8화 이상 누적되면 예상 지표를 보여드려요."}
          </p>
          <p className="text-11pxr text-dark-gray-300 mt-1">
            최근 12화 성과와 이번 주 연재 리듬 기준 추정치입니다.
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-[100px] md:w-[110px]"
        onClick={() => setIsDescSort(!isDescSort)}
      >
        <ArrowUpDown className="w-[11px] md:w-[13px] h-[12px]" />
        <span className="ml-5pxr text-12pxr md:text-14pxr text-dark-gray-500">
          {isDescSort ? "최신순" : "첫회부터"}
        </span>
      </Button>
      {isBulkReserveEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          {isSelectionMode ? (
            <>
              <span className="text-13pxr text-dark-gray-400">
                현재 목록에서 {selectedEpisodeIds.length}화 선택됨
              </span>
              <div className="flex gap-2 ml-auto">
                <Button variant="secondary" size="sm" onClick={resetSelectionMode}>
                  선택취소
                </Button>
                <Button
                  size="sm"
                  disabled={selectedEpisodeIds.length === 0}
                  onClick={() => setIsBulkReserveModalOpen(true)}
                >
                  예약공개
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={() => setIsSelectionMode(true)}
            >
              선택해서 예약
            </Button>
          )}
        </div>
      )}
      <div className="border-t mt-4">
        {sortedEpisodes.map((episode) => (
          <EpisodeRoundItem
            key={episode.episodeId}
            episode={episode}
            isSelectionMode={isSelectionMode}
            isSelected={selectedEpisodeIds.includes(episode.episodeId)}
            onToggleSelect={toggleEpisodeSelection}
          />
        ))}
      </div>
      <BulkReserveModal
        isOpen={isBulkReserveModalOpen}
        onClose={() => setIsBulkReserveModalOpen(false)}
        episodes={selectedEpisodes}
        productId={productId}
        onCompleted={resetSelectionMode}
      />
    </div>
  );
};

interface IEpisodeRoundItemProps {
  episode: IEpisode;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (episodeId: number) => void;
}

const EpisodeRoundItem = ({
  episode,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}: IEpisodeRoundItemProps) => {
  const router = useRouter();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const openEpisodeMutation = useOpenEpisode();
  const cancelReserveMutation = useCancelReserveEpisode();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleToggleVisibility = async () => {
    if (openEpisodeMutation.isPending) {
      return;
    }

    try {
      await openEpisodeMutation.mutateAsync(
        { episodeId: episode.episodeId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", episode.productId],
            });

            if (episode.episodeOpenYn === "Y") {
              setToast({
                message: "회차가 비공개로 변경되었습니다.",
                type: "success",
              });
            } else {
              setToast({
                message: "회차가 공개로 변경되었습니다.",
                type: "success",
              });
            }
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "회차 상태 변경에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch {
      setToast({
        message: "회차 상태 변경에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleCancelReserve = async () => {
    if (cancelReserveMutation.isPending) return;
    try {
      await cancelReserveMutation.mutateAsync(
        { episode_ids: [episode.episodeId] },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", episode.productId],
            });
            setToast({ message: "예약공개가 취소되었습니다.", type: "success" });
          },
          onError: (error: any) => {
            setToast({
              message: error?.response?.data?.message || "예약취소에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch {
      setToast({ message: "예약취소에 실패했습니다.", type: "error" });
    }
  };

  const handleOpenEditEpisode = (targetEpisode: IEpisode) => {
    router.push(
      `/making-episode/${targetEpisode.productId}/${targetEpisode.episodeId}/episode`
    );
  };

  const handleOpenEditByCard = () => {
    if (isSelectionMode) {
      if (episode.openYn !== "Y") {
        onToggleSelect(episode.episodeId);
      }
      return;
    }
    handleOpenEditEpisode(episode);
  };

  const isScheduledRelease = episode.openYn === "N" && episode.publishReserveDate;
  const isSelectable = episode.openYn !== "Y";
  const episodeDateLabel = isScheduledRelease
    ? "예약중"
    : episode.openYn === "Y"
    ? `${formatDate(episode.publishReserveDate || episode.createdDate)}(공개일)`
    : `${formatDate(episode.createdDate)}(등록일)`;

  return (
    <div
      className="py-3 border-b border-b-light-gray-100 flex flex-col cursor-pointer"
      onClick={handleOpenEditByCard}
    >
      <div className="flex gap-3">
        {isSelectionMode && (
          <div
            className="pt-[2px]"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <CheckBox
              label=""
              labelId={`episode-select-${episode.episodeId}`}
              checked={isSelected}
              disabled={!isSelectable}
              onChange={() => {
                if (!isSelectable) return;
                onToggleSelect(episode.episodeId);
              }}
              checkedColor="bg-primary-100 border-primary-100"
              checkBoxStyle="w-[20px] h-[20px] border"
            />
          </div>
        )}
        <div className="flex flex-col gap-[6px] flex-1 min-w-0">
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-1">
            <RoundBadge
              type="custom"
              color={episode.priceType === "paid" ? "bg-[#E85757]" : "bg-[#4CAF50]"}
              text={episode.priceType === "paid" ? "유료" : "무료"}
              className="h-[18px]"
            />
            {isScheduledRelease && <RoundBadge type="reservation" />}
            {episode.openYn === "Y" && <RoundBadge type="release" />}
            {episode.openYn === "N" && !isScheduledRelease && (
              <RoundBadge type="private" />
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-13pxr font-semibold text-dark-gray-300">
              {episode.episodeTextCount}자
            </span>
            {!isSelectionMode && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <SimpleMenu
                  menuList={[
                    {
                      title: "수정",
                      onClick: () => handleOpenEditEpisode(episode),
                    },
                    {
                      title: episode.episodeOpenYn === "Y" ? "비공개" : "공개",
                      onClick: handleToggleVisibility,
                    },
                    ...(isScheduledRelease
                      ? [
                          {
                            title: "예약취소",
                            onClick: handleCancelReserve,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>
        </div>
        <div className="text-16pxr font-semibold">{episode.episodeTitle}</div>
        {isScheduledRelease && (
          <span className="text-primary-100 text-11pxr md:text-13pxr">
            {formatDateTime(episode.publishReserveDate)} 공개예정
          </span>
        )}
        {episode.createdDate && (
          <div>
            <div className="flex gap-3 items-center">
              <span className="text-11pxr text-gray-500">
                {episodeDateLabel}
              </span>
              <span className="text-gray-300 text-12pxr"> | </span>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <View className="w-3 h-[14px]" />
                {episode.countView}
                <IncresedCount increasedCount={episode.countHitIndicator || 0} />
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Image src="/images/like.svg" width={15} height={12} alt="좋아요" />
                {episode.countLike}
                <IncresedCount increasedCount={episode.countLikeIndicator || 0} />
              </div>
              <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                <Image
                  src="/images/message-gray.svg"
                  width={14}
                  height={14}
                  alt="comment"
                />
                {episode.countComment}
                <IncresedCount increasedCount={episode.countCommentIndicator || 0} />
              </div>
              {SHOW_PRODUCT_EVALUATION_SURFACE && (
                <div className="text-dark-gray-300 text-13pxr flex gap-1 items-center">
                  <Rating className="w-[14px] h-[14px] text-dark-gray-300" />
                  {episode.countEvaluation}
                  <IncresedCount
                    increasedCount={episode.countEvaluationIndicator || 0}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

const IncresedCount = ({ increasedCount }: { increasedCount: number }) => {
  const color = increasedCount > 0 ? "text-primary-100" : "text-red-100";
  return (
    <div className="flex gap-1 items-center">
      <Image
        src={increasedCount > 0 ? "/images/short.svg" : "/images/long.svg"}
        width={8}
        height={8}
        alt="증감"
      />
      <span className={`text-10pxr ${color}`}>{increasedCount}</span>
    </div>
  );
};

export default EpisodeRoundTab;

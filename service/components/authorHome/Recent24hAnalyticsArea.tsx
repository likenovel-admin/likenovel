"use client";

import { useProductRecent24hStatistics } from "@/app/api/query/author/statistics";
import {
  AuthorRecent24hRankStatus,
  IAuthorProductRecent24hEpisodeRow,
} from "@/app/api/query/author/statistics/dto";
import { sampleRecent24h } from "./sampleProductAnalytics.mock";
import Spinner from "@/components/common/Spinner";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

const EPISODES_PER_PAGE = 20;

type SortType = "recent24h" | "episodeNo";

interface Props {
  productId?: number;
  isSample?: boolean;
}

const formatNumber = (value: number | null | undefined) =>
  typeof value === "number" ? value.toLocaleString("ko-KR") : "-";

const formatSignedNumber = (value: number | null | undefined) => {
  if (typeof value !== "number") {
    return "-";
  }

  if (value > 0) {
    return `+${formatNumber(value)}`;
  }

  return formatNumber(value);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return dayjs(value).format("YYYY.MM.DD HH:mm");
};

const formatShare = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }

  return `${(value * 100).toFixed(1)}%`;
};

const getRankStatusLabel = (status: AuthorRecent24hRankStatus | undefined) => {
  switch (status) {
    case "reflected":
      return "반영 완료";
    case "pending":
      return "미반영";
    case "excluded":
      return "후보 제외";
    case "not_ready":
      return "준비 중";
    default:
      return status || "준비 중";
  }
};

const getEpisodeTitle = (row: IAuthorProductRecent24hEpisodeRow) =>
  row.episodeTitle || `${row.episodeNo}화`;

const buildSegmentRows = (episodes: IAuthorProductRecent24hEpisodeRow[]) => {
  const sorted = [...episodes].sort((a, b) => a.episodeNo - b.episodeNo);
  const latestEpisodeNos = new Set(sorted.slice(-5).map((row) => row.episodeNo));
  const sum = (rows: IAuthorProductRecent24hEpisodeRow[]) =>
    rows.reduce((total, row) => total + row.recent24hCountHit, 0);

  return [
    { label: "초반부 1~10화", value: sum(sorted.filter((row) => row.episodeNo <= 10)) },
    {
      label: "중반부 11~100화",
      value: sum(sorted.filter((row) => row.episodeNo >= 11 && row.episodeNo <= 100)),
    },
    { label: "후반부 101화~", value: sum(sorted.filter((row) => row.episodeNo >= 101)) },
    {
      label: "최신 5화",
      value: sum(sorted.filter((row) => latestEpisodeNos.has(row.episodeNo))),
    },
  ];
};

const Recent24hAnalyticsArea = ({ productId, isSample = false }: Props) => {
  const [sortType, setSortType] = useState<SortType>("recent24h");
  const [page, setPage] = useState(1);
  const {
    data: liveData,
    isLoading,
    isFetching,
    error,
  } = useProductRecent24hStatistics({
    productId,
    enabled: typeof productId === "number" && !isSample,
  });
  const data = isSample ? sampleRecent24h : liveData;

  useEffect(() => {
    setPage(1);
  }, [productId]);

  const episodes = useMemo(() => data?.episodes || [], [data?.episodes]);
  const sortedEpisodes = useMemo(() => {
    const nextRows = [...episodes];

    if (sortType === "episodeNo") {
      return nextRows.sort((a, b) => a.episodeNo - b.episodeNo);
    }

    return nextRows.sort((a, b) => {
      const recentDiff = b.recent24hCountHit - a.recent24hCountHit;
      if (recentDiff !== 0) {
        return recentDiff;
      }

      return a.episodeNo - b.episodeNo;
    });
  }, [episodes, sortType]);

  const totalPages = Math.max(1, Math.ceil(sortedEpisodes.length / EPISODES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const currentEpisodeRows = sortedEpisodes.slice(
    (safePage - 1) * EPISODES_PER_PAGE,
    safePage * EPISODES_PER_PAGE
  );
  const segmentRows = useMemo(() => buildSegmentRows(episodes), [episodes]);
  const maxHourlyCount = Math.max(
    1,
    ...(data?.hourly || []).map((row) => row.countHit)
  );
  const recent24hCountHit = data?.summary.recent24hCountHit;
  const previous24hCountHit = data?.summary.previous24hCountHit;
  const hasComparableRecent24hCounts =
    typeof recent24hCountHit === "number" &&
    typeof previous24hCountHit === "number";
  const diffFromPrevious = hasComparableRecent24hCounts
    ? recent24hCountHit - previous24hCountHit
    : undefined;
  const hasUnavailableState = !!error || !data;

  if (!productId && !isSample) {
    return (
      <div className="border border-light-gray-300 rounded-[10px] bg-white px-18pxr py-28pxr text-14pxr text-dark-gray-300">
        작품을 선택해 주세요.
      </div>
    );
  }

  if (isLoading || (isFetching && !data)) {
    return (
      <div className="w-full min-h-[260px] flex justify-center items-center border border-light-gray-300 rounded-[10px] bg-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14pxr">
      {isSample ? (
        <div className="rounded-[10px] bg-light-gray-100 px-16pxr py-10pxr text-12pxr text-dark-gray-400">
          화면 이해를 돕기 위한 예시 데이터입니다. 실제 작품의 최근 24시간 수치가 아닙니다.
        </div>
      ) : null}

      {hasUnavailableState ? (
        <div className="border border-light-gray-300 rounded-[10px] bg-white px-18pxr py-16pxr text-13pxr text-dark-gray-400">
          최근 24시간 집계가 아직 준비되지 않았습니다. Top50 랭킹에는 아직 반영되지 않습니다.
        </div>
      ) : null}

      <div className="border border-light-gray-300 rounded-[10px] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-light-gray-300">
          <div className="p-16pxr">
            <div className="text-13pxr text-dark-gray-400">최근 24시간 조회수</div>
            <div className="mt-8pxr text-26pxr font-semibold text-black-100">
              {formatNumber(data?.summary.recent24hCountHit)}
            </div>
          </div>
          <div className="p-16pxr">
            <div className="text-13pxr text-dark-gray-400">전 24시간 대비</div>
            <div className="mt-8pxr text-26pxr font-semibold text-black-100">
              {formatSignedNumber(data ? diffFromPrevious : undefined)}
            </div>
          </div>
          <div className="p-16pxr">
            <div className="text-13pxr text-dark-gray-400">누적 조회수</div>
            <div className="mt-8pxr text-26pxr font-semibold text-black-100">
              {formatNumber(data?.summary.cumulativeCountHit)}
            </div>
          </div>
          <div className="p-16pxr">
            <div className="text-13pxr text-dark-gray-400">Top50 반영 상태</div>
            <div className="mt-8pxr text-20pxr font-semibold text-black-100">
              {getRankStatusLabel(data?.summary.rankStatus)}
            </div>
          </div>
        </div>
        <div className="border-t border-light-gray-300 px-16pxr py-12pxr text-12pxr text-dark-gray-400">
          집계 기준: {formatDateTime(data?.fromAt)} ~ {formatDateTime(data?.toAt)}
          <span className="mx-8pxr text-light-gray-600">|</span>
          집계 기준시각: {formatDateTime(data?.summary.rankBasisAt || data?.basisAt)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-14pxr">
        <div className="border border-light-gray-300 rounded-[10px] bg-white">
          <div className="px-16pxr py-14pxr border-b border-light-gray-300">
            <div className="text-15pxr font-semibold text-black-100">최근 24시간 흐름</div>
          </div>
          <div className="px-16pxr py-16pxr">
            {data?.hourly?.length ? (
              <div>
                <div className="flex items-end gap-4pxr h-[128px]">
                  {data.hourly.map((row) => (
                    <div
                      key={row.hourLabel}
                      className="flex-1 min-w-[4px] bg-dark-gray-700 rounded-t-[2px]"
                      style={{
                        height: `${Math.max(4, (row.countHit / maxHourlyCount) * 120)}px`,
                      }}
                      title={`${row.hourLabel} ${formatNumber(row.countHit)}`}
                    />
                  ))}
                </div>
                <div className="flex gap-4pxr mt-6pxr">
                  {data.hourly.map((row, idx) => (
                    <span
                      key={`hour-label-${row.hourLabel}`}
                      className="flex-1 min-w-[4px] text-center text-10pxr text-dark-gray-300 whitespace-nowrap"
                    >
                      {idx % 6 === 0 || idx === data.hourly.length - 1
                        ? row.hourLabel
                        : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[128px] flex items-center text-13pxr text-dark-gray-300">
                시간대별 집계가 준비되면 24개 구간으로 표시됩니다.
              </div>
            )}
          </div>
        </div>

        <div className="border border-light-gray-300 rounded-[10px] bg-white">
          <div className="px-16pxr py-14pxr border-b border-light-gray-300">
            <div className="text-15pxr font-semibold text-black-100">어디서 읽혔나</div>
          </div>
          <div className="divide-y divide-light-gray-300">
            {segmentRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-16pxr py-12pxr text-14pxr"
              >
                <span className="text-dark-gray-500">{row.label}</span>
                <span className="font-medium text-black-100">{formatNumber(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-light-gray-300 rounded-[10px] bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10pxr px-16pxr py-14pxr border-b border-light-gray-300">
          <div>
            <div className="text-15pxr font-semibold text-black-100">회차별 조회 증가</div>
            <div className="mt-4pxr text-12pxr text-dark-gray-300">
              전체 {formatNumber(data?.totalEpisodeCount || episodes.length)}화 · {safePage} / {totalPages}
            </div>
          </div>
          <div className="flex items-center gap-8pxr">
            <select
              value={sortType}
              onChange={(event) => {
                setSortType(event.target.value as SortType);
                setPage(1);
              }}
              className="h-[36px] border border-light-gray-300 rounded-[8px] px-10pxr text-13pxr text-dark-gray-500 bg-white"
            >
              <option value="recent24h">최근 24h 높은 순</option>
              <option value="episodeNo">회차순</option>
            </select>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className="h-[36px] w-[36px] border border-light-gray-300 rounded-[8px] text-15pxr text-dark-gray-500 disabled:opacity-35"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className="h-[36px] w-[36px] border border-light-gray-300 rounded-[8px] text-15pxr text-dark-gray-500 disabled:opacity-35"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-13pxr text-left text-dark-gray-500">
            <thead className="bg-light-gray-100 text-dark-gray-400">
              <tr>
                <th className="px-12pxr py-12pxr font-medium text-right">회차</th>
                <th className="px-12pxr py-12pxr font-medium">제목</th>
                <th className="px-12pxr py-12pxr font-medium text-right">최근 24시간</th>
                <th className="px-12pxr py-12pxr font-medium text-right">기준시점 누적</th>
                <th className="px-12pxr py-12pxr font-medium text-right">비중</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-gray-300">
              {currentEpisodeRows.length ? (
                currentEpisodeRows.map((row) => (
                  <tr key={row.episodeId}>
                    <td className="px-12pxr py-12pxr text-right whitespace-nowrap">
                      {formatNumber(row.episodeNo)}
                    </td>
                    <td className="px-12pxr py-12pxr font-medium text-black-100">
                      {getEpisodeTitle(row)}
                    </td>
                    <td className="px-12pxr py-12pxr text-right">
                      {formatNumber(row.recent24hCountHit)}
                    </td>
                    <td className="px-12pxr py-12pxr text-right">
                      {formatNumber(row.cumulativeCountHit)}
                    </td>
                    <td className="px-12pxr py-12pxr text-right">
                      {formatShare(row.shareRate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-16pxr py-28pxr text-center text-dark-gray-300">
                    표시할 회차별 집계가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-light-gray-300">
          {currentEpisodeRows.length ? (
            currentEpisodeRows.map((row) => (
              <div key={row.episodeId} className="p-16pxr flex flex-col gap-6pxr">
                <div className="text-14pxr font-semibold text-black-100">
                  {getEpisodeTitle(row)}
                </div>
                <div className="text-13pxr text-dark-gray-400">
                  {formatNumber(row.recent24hCountHit)} · 누적 {formatNumber(row.cumulativeCountHit)} · {formatShare(row.shareRate)}
                </div>
              </div>
            ))
          ) : (
            <div className="px-16pxr py-28pxr text-14pxr text-dark-gray-300">
              표시할 회차별 집계가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recent24hAnalyticsArea;

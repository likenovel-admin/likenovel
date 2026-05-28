"use client";

import { useGetMyProducts } from "@/app/api/query/author/product";
import {
  useProductDetailFunnelStatistics,
  useProductEpisodeDropoffStatistics,
  useProductInflowDropoffStatistics,
} from "@/app/api/query/author/statistics";
import {
  IAuthorProductDetailFunnelRow,
  IAuthorProductEpisodeDropoffRow,
  IAuthorProductInflowDropoffSourceGroup,
} from "@/app/api/query/author/statistics/dto";
import Spinner from "@/components/common/Spinner";
import DatePicker from "@/components/form/datepicker";
import SelectBox from "@/components/form/selectbox";
import { IProduct } from "@/types";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import Recent24hAnalyticsArea from "./Recent24hAnalyticsArea";

const DEFAULT_RANGE_DAYS = 29;
const MAX_RANGE_DAYS = 90;
const RANGE_PRESET_OPTIONS = [
  { label: "최근 7일", days: 6 },
  { label: "최근 30일", days: 29 },
  { label: "최근 90일", days: 89 },
] as const;

const formatNumber = (value: number) => value.toLocaleString("ko-KR");

const formatPercent = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
};

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) {
    return "0.0%";
  }

  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

const sourceLabelMap: Record<string, string> = {
  home_free_top: "홈 무료 TOP",
  home_paid_top: "홈 유료 TOP",
  recently_viewed: "최근 본 작품",
  ai_taste_section: "AI 취향 추천",
  ai_chat_panel: "AI 챗 추천",
  search_recommend: "검색 추천",
  search_popular: "인기 검색",
  search_result: "검색 결과",
  preference_last_viewed: "보관함 최근 본 작품",
  preference_bookmark: "보관함 선호작",
  preference_interest_drop: "보관함 관심 이탈",
  top50: "TOP50",
  event_product: "이벤트 작품",
  review_product: "리뷰 작품",
  paid_promotion: "유료 프로모션",
  main_bottom_recommend: "메인 하단 추천",
  main_interest_drop: "메인 관심 이탈",
  viewer_recommended: "뷰어 추천 작품",
  product_suggest: "작품 상세 추천",
  same_author_product: "작가의 다른 작품",
  cp_promotion: "CP 프로모션",
};

const sourceGroupLabelMap: Record<string, string> = {
  social: "소셜유입",
  recommend_slot: "구좌유입",
  search: "검색유입",
  ranking: "랭킹유입",
  direct: "직접유입",
  other: "기타",
};

const sourceGroupOrder = [
  "social",
  "recommend_slot",
  "search",
  "ranking",
  "direct",
  "other",
] as const;

const getSourceLabel = (entrySource: string | null) => {
  if (!entrySource) {
    return "직접 유입 또는 기타";
  }

  return sourceLabelMap[entrySource] ?? entrySource;
};

const getSourceGroupLabel = (row: IAuthorProductInflowDropoffSourceGroup) => {
  return (
    sourceGroupLabelMap[row.entry_source_group] ||
    row.source_label ||
    sourceGroupLabelMap.other
  );
};

const getDominantDropoffBucketLabel = (
  row: IAuthorProductEpisodeDropoffRow
) => {
  const buckets = [
    { label: "0~10%", count: row.dropoff_0_10_count },
    { label: "10~30%", count: row.dropoff_10_30_count },
    { label: "30~60%", count: row.dropoff_30_60_count },
    { label: "60~90%", count: row.dropoff_60_90_count },
    { label: "90~95%", count: row.dropoff_90_plus_count },
  ];

  const dominantBucket = buckets.reduce((best, current) =>
    current.count > best.count ? current : best
  );

  if (dominantBucket.count === 0) {
    return "-";
  }

  return dominantBucket.label;
};

const getTopDropoffRow = (rows: IAuthorProductEpisodeDropoffRow[]) => {
  if (!rows.length) {
    return null;
  }

  return [...rows].sort((a, b) => {
    const dropoffDiff = b.episode_dropoff_count - a.episode_dropoff_count;
    if (dropoffDiff !== 0) {
      return dropoffDiff;
    }

    const rateDiff = b.episode_dropoff_rate - a.episode_dropoff_rate;
    if (rateDiff !== 0) {
      return rateDiff;
    }

    return a.episode_no - b.episode_no;
  })[0];
};

const buildInitialStartDate = () =>
  dayjs().subtract(DEFAULT_RANGE_DAYS, "day").startOf("day").toDate();

const buildInitialEndDate = () => dayjs().startOf("day").toDate();

const getProductEpisodeCount = (product: IProduct) =>
  product.trendindex?.hasEpisodeCount ?? product.latestEpisodeNo ?? 0;

const getDateRangeValidationMessage = (
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!startDate || !endDate) {
    return "시작일과 종료일을 모두 선택해 주세요.";
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (start.isAfter(end)) {
    return "시작일은 종료일보다 늦을 수 없습니다.";
  }

  if (end.diff(start, "day") > MAX_RANGE_DAYS - 1) {
    return "조회 기간은 최대 90일까지 선택할 수 있습니다.";
  }

  return "";
};

const MyProductAnalyticsArea = () => {
  const [activeSubTab, setActiveSubTab] = useState<"recent24h" | "inflowDropoff">(
    "recent24h"
  );
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(
    buildInitialStartDate()
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(buildInitialEndDate());
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({
    productId: "",
    startDate: buildInitialStartDate(),
    endDate: buildInitialEndDate(),
  });

  const { data: myProductsData, isLoading: isProductsLoading } = useGetMyProducts();
  const products = useMemo(
    () => myProductsData?.data?.products || [],
    [myProductsData]
  );
  const hasProducts = products.length > 0;
  const initialSeedStartDate = useMemo(
    () => dayjs(buildInitialStartDate()).format("YYYY-MM-DD"),
    []
  );
  const initialSeedEndDate = useMemo(
    () => dayjs(buildInitialEndDate()).format("YYYY-MM-DD"),
    []
  );
  const {
    data: defaultProductSeedData,
    isLoading: isDefaultProductSeedLoading,
  } = useProductDetailFunnelStatistics({
    startDate: initialSeedStartDate,
    endDate: initialSeedEndDate,
    page: 1,
    countPerPage: 1000,
    enabled: hasProducts && !appliedFilters.productId,
  });
  const productIdsWithAnalyticsData = useMemo(() => {
    const rows = defaultProductSeedData?.results || [];
    return new Set(rows.map((row) => row.product_id));
  }, [defaultProductSeedData]);
  const defaultProductId = useMemo(() => {
    if (!products.length) {
      return "";
    }

    if (isDefaultProductSeedLoading) {
      return "";
    }

    const seededProducts = products.filter((product) =>
      productIdsWithAnalyticsData.has(product.productId)
    );
    const candidateProducts = seededProducts.length > 0 ? seededProducts : products;

    const sorted = [...candidateProducts].sort((a, b) => {
      const episodeDiff = getProductEpisodeCount(b) - getProductEpisodeCount(a);
      if (episodeDiff !== 0) {
        return episodeDiff;
      }
      return a.productId - b.productId;
    });

    return String(sorted[0]?.productId ?? "");
  }, [isDefaultProductSeedLoading, productIdsWithAnalyticsData, products]);

  useEffect(() => {
    if (!defaultProductId) {
      return;
    }

    setSelectedProductId((prev) => prev || defaultProductId);
    setAppliedFilters((prev) =>
      prev.productId ? prev : { ...prev, productId: defaultProductId }
    );
  }, [defaultProductId]);

  const appliedProductId = appliedFilters.productId
    ? Number(appliedFilters.productId)
    : undefined;
  const appliedStartDateText = dayjs(appliedFilters.startDate).format("YYYY-MM-DD");
  const appliedEndDateText = dayjs(appliedFilters.endDate).format("YYYY-MM-DD");

  const {
    data: funnelData,
    isLoading: isFunnelLoading,
    isFetching,
    error,
  } = useProductDetailFunnelStatistics({
    productId: appliedProductId,
    startDate: appliedStartDateText,
    endDate: appliedEndDateText,
    page,
    countPerPage: 100,
    enabled: hasProducts && !!appliedFilters.productId,
  });
  const {
    data: episodeDropoffData,
    isLoading: isEpisodeDropoffLoading,
    isFetching: isEpisodeDropoffFetching,
    error: episodeDropoffError,
  } = useProductEpisodeDropoffStatistics({
    productId: appliedProductId,
    startDate: appliedStartDateText,
    endDate: appliedEndDateText,
    page: 1,
    countPerPage: 1000,
    enabled: hasProducts && !!appliedFilters.productId,
  });
  const {
    data: inflowDropoffData,
    isLoading: isInflowDropoffLoading,
    isFetching: isInflowDropoffFetching,
    error: inflowDropoffError,
  } = useProductInflowDropoffStatistics({
    productId: appliedProductId,
    startDate: appliedStartDateText,
    endDate: appliedEndDateText,
    enabled: hasProducts && !!appliedFilters.productId,
  });

  const productOptions = useMemo<CommonSelectItem[]>(() => {
    return products.map((product) => ({
      label: product.title,
      value: String(product.productId),
    }));
  }, [products]);

  const productTitleMap = useMemo(() => {
    return new Map(products.map((product) => [product.productId, product.title]));
  }, [products]);

  const summary = useMemo(() => {
    const results = funnelData?.results || [];

    return results.reduce(
      (acc, row) => {
        acc.detailViewSessions += row.detail_view_session_count;
        acc.detailToViewSessions += row.detail_to_view_session_count;
        acc.detailExitSessions += row.detail_exit_session_count;
        acc.episodeExitEvents += row.episode_exit_event_count;
        if (row.avg_episode_exit_progress_ratio !== null) {
          acc.weightedEpisodeExitProgress +=
            row.avg_episode_exit_progress_ratio * row.episode_exit_event_count;
        }
        return acc;
      },
      {
        detailViewSessions: 0,
        detailToViewSessions: 0,
        detailExitSessions: 0,
        episodeExitEvents: 0,
        weightedEpisodeExitProgress: 0,
      }
    );
  }, [funnelData]);

  const sourceGroupRows = useMemo(() => {
    const source_groups = inflowDropoffData?.source_groups || [];
    const orderIndex = new Map<string, number>(
      sourceGroupOrder.map((source, index) => [source, index])
    );

    return [...source_groups].sort((a, b) => {
      const sourceOrderDiff =
        (orderIndex.get(a.entry_source_group) ?? sourceGroupOrder.length) -
        (orderIndex.get(b.entry_source_group) ?? sourceGroupOrder.length);
      if (sourceOrderDiff !== 0) {
        return sourceOrderDiff;
      }

      return b.detail_session_count - a.detail_session_count;
    });
  }, [inflowDropoffData?.source_groups]);

  const sourceGroupSummary = useMemo(() => {
    return sourceGroupRows.reduce(
      (acc, row) => {
        acc.detailViewSessions += row.detail_session_count;
        acc.detailToViewSessions += row.reader_session_count;
        acc.detailExitSessions += row.detail_exit_session_count;
        return acc;
      },
      {
        detailViewSessions: 0,
        detailToViewSessions: 0,
        detailExitSessions: 0,
      }
    );
  }, [sourceGroupRows]);

  const rows = useMemo(() => funnelData?.results || [], [funnelData?.results]);
  const episodeDropoffRows = useMemo(
    () => episodeDropoffData?.results || [],
    [episodeDropoffData?.results]
  );
  const topDropoffRow = useMemo(
    () => getTopDropoffRow(episodeDropoffRows),
    [episodeDropoffRows]
  );
  const topDropoffSummary = useMemo(() => {
    if (!topDropoffRow || topDropoffRow.episode_dropoff_count === 0) {
      return "";
    }

    const dominantBucket = getDominantDropoffBucketLabel(topDropoffRow);
    const episodeLabel = topDropoffRow.episode_title
      ? `${topDropoffRow.episode_title} 회차`
      : `${topDropoffRow.episode_no}화 회차`;

    return `${episodeLabel}에서 ${dominantBucket} 부근에서 많이 멈추고 있습니다.`;
  }, [topDropoffRow]);
  const topDropoffDetailSummary = useMemo(() => {
    if (!topDropoffRow || topDropoffRow.episode_dropoff_count === 0) {
      return "";
    }

    return `이 회차는 진입 후 ${formatPercent(topDropoffRow.episode_dropoff_rate)}가 여기서 멈췄습니다.`;
  }, [topDropoffRow]);
  const totalCount = funnelData?.total_count || 0;
  const countPerPage = funnelData?.count_per_page || 100;
  const totalPages = Math.max(1, Math.ceil(totalCount / countPerPage));
  const dateRangeValidationMessage = getDateRangeValidationMessage(
    draftStartDate,
    draftEndDate
  );
  const averageEpisodeExitProgress =
    summary.episodeExitEvents > 0
      ? summary.weightedEpisodeExitProgress / summary.episodeExitEvents
      : null;
  const hasSourceGroupSummary = sourceGroupRows.some(
    (row) => row.detail_session_count > 0
  );
  const summaryDetailViewSessions = hasSourceGroupSummary
    ? sourceGroupSummary.detailViewSessions
    : summary.detailViewSessions;
  const summaryDetailToViewSessions = hasSourceGroupSummary
    ? sourceGroupSummary.detailToViewSessions
    : summary.detailToViewSessions;
  const summaryDetailExitSessions = hasSourceGroupSummary
    ? sourceGroupSummary.detailExitSessions
    : summary.detailExitSessions;

  const applyPresetRange = (days: number) => {
    const nextEndDate = buildInitialEndDate();
    const nextStartDate = dayjs(nextEndDate).subtract(days, "day").startOf("day").toDate();
    setDraftStartDate(nextStartDate);
    setDraftEndDate(nextEndDate);
  };

  const handleApplyFilters = () => {
    if (dateRangeValidationMessage) {
      return;
    }

    const start = dayjs(draftStartDate).startOf("day");
    const end = dayjs(draftEndDate).startOf("day");
    setPage(1);
    setAppliedFilters({
      productId: selectedProductId,
      startDate: start.toDate(),
      endDate: end.toDate(),
    });
  };

  const handleResetFilters = () => {
    const nextStartDate = buildInitialStartDate();
    const nextEndDate = buildInitialEndDate();

    setSelectedProductId(defaultProductId);
    setDraftStartDate(nextStartDate);
    setDraftEndDate(nextEndDate);
    setPage(1);
    setAppliedFilters({
      productId: defaultProductId,
      startDate: nextStartDate,
      endDate: nextEndDate,
    });
  };

  const renderTableRow = (row: IAuthorProductDetailFunnelRow) => {
    return (
      <tr key={`${row.detail_entry_date}-${row.product_id}-${row.entry_source ?? "__null__"}`}>
        <td className="px-12pxr py-12pxr whitespace-nowrap">
          {row.detail_entry_date}
        </td>
        <td className="px-12pxr py-12pxr whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-medium text-black-100">
              {productTitleMap.get(row.product_id) || `작품 ${row.product_id}`}
            </span>
            <span className="text-12pxr text-dark-gray-300">ID {row.product_id}</span>
          </div>
        </td>
        <td className="px-12pxr py-12pxr whitespace-nowrap">
          {getSourceLabel(row.entry_source)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_view_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_to_view_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatRate(
            row.detail_to_view_session_count,
            row.detail_view_session_count
          )}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_exit_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.episode_exit_event_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatPercent(row.avg_episode_exit_progress_ratio)}
        </td>
      </tr>
    );
  };

  const renderEpisodeDropoffRow = (row: IAuthorProductEpisodeDropoffRow) => {
    return (
      <tr key={`${row.product_id}-${row.episode_id}`}>
        <td className="px-12pxr py-12pxr whitespace-nowrap text-right">
          {formatNumber(row.episode_no)}
        </td>
        <td className="px-12pxr py-12pxr">
          <div className="flex flex-col">
            <span className="font-medium text-black-100">
              {row.episode_title || `${row.episode_no}화`}
            </span>
            <span className="text-12pxr text-dark-gray-300">회차 ID {row.episode_id}</span>
          </div>
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.read_start_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.episode_dropoff_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatRate(row.episode_dropoff_count, row.read_start_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {getDominantDropoffBucketLabel(row)}
        </td>
      </tr>
    );
  };

  const renderSourceGroupRow = (row: IAuthorProductInflowDropoffSourceGroup) => {
    return (
      <tr key={row.entry_source_group}>
        <td className="px-12pxr py-12pxr whitespace-nowrap font-medium text-black-100">
          {getSourceGroupLabel(row)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_visitor_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.reader_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatPercent(row.read_conversion_rate)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatNumber(row.detail_exit_session_count)}
        </td>
        <td className="px-12pxr py-12pxr text-right">
          {formatPercent(row.detail_exit_rate)}
        </td>
      </tr>
    );
  };

  if (isProductsLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
        <Spinner />
      </div>
    );
  }

  if (!hasProducts) {
    return (
      <div className="w-full h-auto">
        <div className="flex flex-col w-full max-w-[1120px] mx-auto px-16pxr md:px-0 pt-24pxr md:pt-30pxr pb-20pxr gap-16pxr">
          <div className="flex flex-col gap-6pxr">
            <span className="text-18pxr md:text-22pxr font-semibold text-black-100">
              작품별분석
            </span>
            <span className="text-13pxr md:text-14pxr text-dark-gray-300">
              작품 상세페이지를 본 뒤 독자가 실제로 읽기를 시작했는지, 어디에서 멈췄는지 확인할 수 있습니다.
            </span>
          </div>

          <div className="border border-light-gray-300 rounded-[20px] bg-white shadow-sm px-20pxr py-32pxr text-14pxr text-dark-gray-300">
            등록된 작품이 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-auto">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto px-16pxr md:px-0 pt-24pxr md:pt-30pxr pb-20pxr gap-16pxr">
        <div className="flex flex-col gap-6pxr">
          <span className="text-18pxr md:text-22pxr font-semibold text-black-100">
            작품별분석
          </span>
          <span className="text-13pxr md:text-14pxr text-dark-gray-300">
            최근 조회 흐름과 독자 유입·이탈을 확인할 수 있습니다.
          </span>
        </div>

        <div className="flex border-b border-light-gray-300">
          <button
            type="button"
            onClick={() => setActiveSubTab("recent24h")}
            className={`h-[42px] px-14pxr text-14pxr font-medium border-b-2 ${
              activeSubTab === "recent24h"
                ? "border-black-100 text-black-100"
                : "border-transparent text-dark-gray-300"
            }`}
          >
            최근 24시간
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("inflowDropoff")}
            className={`h-[42px] px-14pxr text-14pxr font-medium border-b-2 ${
              activeSubTab === "inflowDropoff"
                ? "border-black-100 text-black-100"
                : "border-transparent text-dark-gray-300"
            }`}
          >
            유입/이탈
          </button>
        </div>

        {activeSubTab === "recent24h" ? (
          <>
            <div className="border border-light-gray-300 rounded-[10px] p-16pxr bg-white">
              <div className="max-w-[360px]">
                <SelectBox
                  label="작품 선택"
                  labelClassName="text-13pxr font-medium text-dark-gray-400 mb-6pxr"
                  options={productOptions}
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="h-[44px] text-14pxr"
                  full
                />
              </div>
            </div>
            <Recent24hAnalyticsArea
              productId={selectedProductId ? Number(selectedProductId) : undefined}
            />
          </>
        ) : (
          <>
        <div className="border border-light-gray-300 rounded-[20px] p-16pxr md:p-20pxr bg-white shadow-sm">
          <div className="flex flex-wrap gap-8pxr mb-12pxr">
            {RANGE_PRESET_OPTIONS.map((preset) => {
              const isSelected =
                !!draftStartDate &&
                !!draftEndDate &&
                dayjs(draftEndDate).isSame(buildInitialEndDate(), "day") &&
                dayjs(draftStartDate).isSame(
                  dayjs(buildInitialEndDate()).subtract(preset.days, "day"),
                  "day"
                );

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPresetRange(preset.days)}
                  className={`h-[36px] px-14pxr rounded-[999px] border text-13pxr font-medium transition-colors ${
                    isSelected
                      ? "border-primary-100 bg-primary-100 text-white"
                      : "border-light-gray-300 text-dark-gray-500 hover:bg-light-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr_1fr_auto_auto] gap-12pxr items-end">
            <SelectBox
              label="작품 선택"
              labelClassName="text-13pxr font-medium text-dark-gray-400 mb-6pxr"
              options={productOptions}
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="h-[44px] text-14pxr"
              full
            />
            <DatePicker
              label="시작일"
              labelStyle="text-13pxr font-medium text-dark-gray-400 mb-6pxr"
              inputStyle="h-[44px] text-14pxr rounded-[8px]"
              value={draftStartDate ?? undefined}
              onChange={setDraftStartDate}
            />
            <DatePicker
              label="종료일"
              labelStyle="text-13pxr font-medium text-dark-gray-400 mb-6pxr"
              inputStyle="h-[44px] text-14pxr rounded-[8px]"
              value={draftEndDate ?? undefined}
              onChange={setDraftEndDate}
            />
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={!!dateRangeValidationMessage}
              className="h-[44px] px-18pxr rounded-[12px] bg-primary-100 text-white text-14pxr font-medium hover:bg-[#ff6f4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-100"
            >
              조회
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-[44px] px-18pxr rounded-[12px] border border-light-gray-300 text-14pxr font-medium text-dark-gray-500 hover:bg-light-gray-200 transition-colors"
            >
              초기화
            </button>
          </div>
          <div className="mt-10pxr flex items-center justify-between gap-10pxr flex-wrap">
            <span className="text-12pxr text-dark-gray-300">
              최근 7일, 30일, 90일을 빠르게 조회할 수 있습니다.
            </span>
            {dateRangeValidationMessage ? (
              <span className="text-12pxr text-red-500">{dateRangeValidationMessage}</span>
            ) : (
              <span className="text-12pxr text-dark-gray-300">
                조회 기간은 최대 90일까지 선택할 수 있습니다.
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10pxr">
          <div className="border border-light-gray-300 rounded-[16px] p-16pxr bg-white">
            <div className="text-13pxr text-dark-gray-300">상세페이지 유입</div>
            <div className="mt-6pxr text-20pxr md:text-24pxr font-semibold text-black-100">
              {formatNumber(summaryDetailViewSessions)}
            </div>
            <div className="mt-6pxr text-12pxr text-dark-gray-300">
              작품 상세페이지에 들어온 횟수입니다.
            </div>
          </div>
          <div className="border border-light-gray-300 rounded-[16px] p-16pxr bg-white">
            <div className="text-13pxr text-dark-gray-300">회차 유입</div>
            <div className="mt-6pxr text-20pxr md:text-24pxr font-semibold text-black-100">
              {formatNumber(summaryDetailToViewSessions)}
            </div>
            <div className="mt-6pxr text-12pxr text-dark-gray-300">
              상세페이지에서 실제 회차 화면으로 넘어간 횟수입니다.
            </div>
          </div>
          <div className="border border-light-gray-300 rounded-[16px] p-16pxr bg-white">
            <div className="text-13pxr text-dark-gray-300">회차 유입률</div>
            <div className="mt-6pxr text-20pxr md:text-24pxr font-semibold text-black-100">
              {formatRate(summaryDetailToViewSessions, summaryDetailViewSessions)}
            </div>
            <div className="mt-6pxr text-12pxr text-dark-gray-300">
              상세페이지 유입 대비 회차 유입 비율입니다.
            </div>
          </div>
          <div className="border border-light-gray-300 rounded-[16px] p-16pxr bg-white">
            <div className="text-13pxr text-dark-gray-300">상세페이지에서 나감</div>
            <div className="mt-6pxr text-20pxr md:text-24pxr font-semibold text-black-100">
              {formatNumber(summaryDetailExitSessions)}
            </div>
            <div className="mt-6pxr text-12pxr text-dark-gray-300">
              회차로 넘어가지 않고 다른 곳으로 이동한 흐름입니다.
            </div>
          </div>
          <div className="border border-light-gray-300 rounded-[16px] p-16pxr bg-white">
            <div className="text-13pxr text-dark-gray-300">읽다 나간 평균 지점</div>
            <div className="mt-6pxr text-20pxr md:text-24pxr font-semibold text-black-100">
              {formatPercent(averageEpisodeExitProgress)}
            </div>
            <div className="mt-6pxr text-12pxr text-dark-gray-300">
              회차에 들어온 뒤 평균적으로 어디쯤에서 멈췄는지 보여줍니다.
            </div>
          </div>
        </div>

        <div className="border border-light-gray-300 rounded-[20px] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-16pxr md:px-20pxr py-14pxr border-b border-light-gray-300">
            <div className="flex flex-col gap-4pxr">
              <span className="text-16pxr font-semibold text-black-100">상세페이지 유입과 회차 진입</span>
              <span className="text-12pxr text-dark-gray-300">
                구좌·검색·랭킹·직접 유입별로 상세페이지 진입 후 회차를 읽었는지 확인할 수 있습니다.
              </span>
            </div>
            <span className="text-13pxr text-dark-gray-300">
              총 {formatNumber(sourceGroupRows.length)}개 그룹
            </span>
          </div>

          {isInflowDropoffLoading || isInflowDropoffFetching ? (
            <div className="w-full min-h-[220px] flex justify-center items-center">
              <Spinner />
            </div>
          ) : inflowDropoffError ? (
            <div className="px-20pxr py-32pxr text-14pxr text-red-500">
              상세페이지 유입 데이터를 불러오지 못했습니다.
            </div>
          ) : sourceGroupRows.length === 0 ? (
            <div className="px-20pxr py-32pxr text-14pxr text-dark-gray-300">
              선택한 기간에 유입 경로별 집계가 없습니다.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-13pxr text-left text-dark-gray-500">
                  <thead className="bg-light-gray-100 text-dark-gray-400">
                    <tr>
                      <th className="px-12pxr py-12pxr font-medium">유입 그룹</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">상세 유입</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">방문자</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차 유입</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차 유입률</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">상세 이탈</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">상세 이탈률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray-300">
                    {sourceGroupRows.map(renderSourceGroupRow)}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col divide-y divide-light-gray-300">
                {sourceGroupRows.map((row) => (
                  <div
                    key={`${row.entry_source_group}-mobile`}
                    className="p-16pxr flex flex-col gap-8pxr"
                  >
                    <div className="text-14pxr font-semibold text-black-100">
                      {getSourceGroupLabel(row)}
                    </div>
                    <div className="grid grid-cols-2 gap-y-6pxr text-13pxr text-dark-gray-400">
                      <span>상세 유입</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_session_count)}
                      </span>
                      <span>방문자</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_visitor_count)}
                      </span>
                      <span>회차 유입</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.reader_session_count)}
                      </span>
                      <span>회차 유입률</span>
                      <span className="text-right text-black-100">
                        {formatPercent(row.read_conversion_rate)}
                      </span>
                      <span>상세 이탈</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_exit_session_count)}
                      </span>
                      <span>상세 이탈률</span>
                      <span className="text-right text-black-100">
                        {formatPercent(row.detail_exit_rate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border border-light-gray-300 rounded-[20px] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-16pxr md:px-20pxr py-14pxr border-b border-light-gray-300">
            <div className="flex flex-col gap-4pxr">
              <span className="text-16pxr font-semibold text-black-100">회차별 읽다 나감</span>
              <span className="text-12pxr text-dark-gray-300">
                어떤 회차에서 많이 멈췄는지 기간 합산 기준으로 확인할 수 있습니다.
              </span>
              <span className="text-12pxr text-dark-gray-300">
                많이 멈춘 구간은 독자가 주로 어느 지점에서 멈췄는지 보여줍니다.
              </span>
              {topDropoffSummary ? (
                <>
                  <span className="text-13pxr text-black-100 font-medium">
                    {topDropoffSummary}
                  </span>
                  {topDropoffDetailSummary ? (
                    <span className="text-12pxr text-dark-gray-400">
                      {topDropoffDetailSummary}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            <span className="text-13pxr text-dark-gray-300">
              총 {formatNumber(episodeDropoffRows.length)}개 회차
            </span>
          </div>

          {isEpisodeDropoffLoading || isEpisodeDropoffFetching ? (
            <div className="w-full min-h-[220px] flex justify-center items-center">
              <Spinner />
            </div>
          ) : episodeDropoffError ? (
            <div className="px-20pxr py-32pxr text-14pxr text-red-500">
              회차별 읽다 나감 데이터를 불러오지 못했습니다.
            </div>
          ) : episodeDropoffRows.length === 0 ? (
            <div className="px-20pxr py-32pxr text-14pxr text-dark-gray-300">
              선택한 기간에 회차별 읽다 나감 데이터가 없습니다.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-13pxr text-left text-dark-gray-500">
                  <thead className="bg-light-gray-100 text-dark-gray-400">
                    <tr>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차</th>
                      <th className="px-12pxr py-12pxr font-medium">제목</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차 유입</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">읽다 나감</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">이탈률</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">많이 멈춘 구간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray-300">
                    {episodeDropoffRows.map(renderEpisodeDropoffRow)}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col divide-y divide-light-gray-300">
                {episodeDropoffRows.map((row) => (
                  <div
                    key={`${row.product_id}-${row.episode_id}-mobile`}
                    className="p-16pxr flex flex-col gap-8pxr"
                  >
                    <div className="flex items-start justify-between gap-10pxr">
                      <div className="flex flex-col">
                        <span className="text-14pxr font-semibold text-black-100">
                          {row.episode_no}화 {row.episode_title || ""}
                        </span>
                        <span className="text-12pxr text-dark-gray-300">
                          회차 ID {row.episode_id}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-6pxr text-13pxr text-dark-gray-400">
                      <span>회차 유입</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.read_start_count)}
                      </span>
                      <span>읽다 나감</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.episode_dropoff_count)}
                      </span>
                      <span>이탈률</span>
                      <span className="text-right text-black-100">
                        {formatRate(row.episode_dropoff_count, row.read_start_count)}
                      </span>
                      <span>많이 멈춘 구간</span>
                      <span className="text-right text-black-100">
                        {getDominantDropoffBucketLabel(row)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border border-light-gray-300 rounded-[20px] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-16pxr md:px-20pxr py-14pxr border-b border-light-gray-300">
            <div className="flex flex-col gap-4pxr">
              <span className="text-16pxr font-semibold text-black-100">일별 흐름</span>
              <span className="text-12pxr text-dark-gray-300">
                날짜는 상세페이지를 처음 연 날 기준입니다.
              </span>
              <span className="text-12pxr text-dark-gray-300">
                상세페이지 유입부터 회차 유입, 이탈 흐름을 날짜별로 볼 수 있습니다.
              </span>
            </div>
            <span className="text-13pxr text-dark-gray-300">
              총 {formatNumber(totalCount)}건
            </span>
          </div>

          {isFunnelLoading || isFetching ? (
            <div className="w-full min-h-[260px] flex justify-center items-center">
              <Spinner />
            </div>
          ) : error ? (
            <div className="px-20pxr py-32pxr text-14pxr text-red-500">
              통계 데이터를 불러오지 못했습니다.
            </div>
          ) : rows.length === 0 ? (
            <div className="px-20pxr py-32pxr text-14pxr text-dark-gray-300">
              선택한 기간에 집계된 데이터가 없습니다.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-13pxr text-left text-dark-gray-500">
                  <thead className="bg-light-gray-100 text-dark-gray-400">
                    <tr>
                      <th className="px-12pxr py-12pxr font-medium">날짜</th>
                      <th className="px-12pxr py-12pxr font-medium">작품</th>
                      <th className="px-12pxr py-12pxr font-medium">유입 경로</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">상세페이지 유입</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차 유입</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">회차 유입률</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">상세페이지에서 나감</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">읽다 나감</th>
                      <th className="px-12pxr py-12pxr font-medium text-right">읽다 나간 평균 지점</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray-300">
                    {rows.map(renderTableRow)}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col divide-y divide-light-gray-300">
                {rows.map((row) => (
                  <div
                    key={`${row.detail_entry_date}-${row.product_id}-${row.entry_source ?? "__null__"}-mobile`}
                    className="p-16pxr flex flex-col gap-8pxr"
                  >
                    <div className="flex items-start justify-between gap-10pxr">
                      <div className="flex flex-col">
                        <span className="text-14pxr font-semibold text-black-100">
                          {productTitleMap.get(row.product_id) || `작품 ${row.product_id}`}
                        </span>
                        <span className="text-12pxr text-dark-gray-300">
                          {row.detail_entry_date} · {getSourceLabel(row.entry_source)}
                        </span>
                      </div>
                      <span className="text-12pxr text-dark-gray-300">ID {row.product_id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-6pxr text-13pxr text-dark-gray-400">
                      <span>상세페이지 유입</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_view_session_count)}
                      </span>
                      <span>회차 유입</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_to_view_session_count)}
                      </span>
                      <span>회차 유입률</span>
                      <span className="text-right text-black-100">
                        {formatRate(
                          row.detail_to_view_session_count,
                          row.detail_view_session_count
                        )}
                      </span>
                      <span>상세페이지에서 나감</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.detail_exit_session_count)}
                      </span>
                      <span>읽다 나감</span>
                      <span className="text-right text-black-100">
                        {formatNumber(row.episode_exit_event_count)}
                      </span>
                      <span>읽다 나간 평균 지점</span>
                      <span className="text-right text-black-100">
                        {formatPercent(row.avg_episode_exit_progress_ratio)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-16pxr md:px-20pxr py-14pxr border-t border-light-gray-300">
                <span className="text-12pxr md:text-13pxr text-dark-gray-300">
                  {page} / {totalPages} 페이지
                </span>
                <div className="flex gap-8pxr">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="h-[36px] px-14pxr rounded-[10px] border border-light-gray-300 text-13pxr text-dark-gray-500 disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="h-[36px] px-14pxr rounded-[10px] border border-light-gray-300 text-13pxr text-dark-gray-500 disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyProductAnalyticsArea;

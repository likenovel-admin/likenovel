"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { item_per_page } from "@/constants/common";
import { useGetStatisticSitePageRoutes } from "@/api/statistic";
import { calculatePageCount } from "@/lib/utils";
import { IStatisticSitePageRoute } from "@/types/statistic";

const routeGroupOptions = [
  { value: "all", label: "전체" },
  { value: "home", label: "홈" },
  { value: "viewer", label: "뷰어" },
  { value: "product_detail", label: "작품 상세" },
  { value: "search", label: "검색" },
  { value: "ranking", label: "랭킹" },
  { value: "catalog", label: "카탈로그" },
  { value: "promotion", label: "프로모션" },
  { value: "event", label: "이벤트" },
  { value: "websochat", label: "웹소챗" },
  { value: "review", label: "리뷰" },
  { value: "quest", label: "퀘스트" },
  { value: "author", label: "작가" },
  { value: "notice", label: "공지" },
  { value: "faq", label: "FAQ" },
  { value: "legal", label: "약관" },
  { value: "vote", label: "투표" },
];

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatDuration(ms: number | null | undefined) {
  const totalSeconds = Math.round(Number(ms || 0) / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}초`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${seconds}초`;
}

function formatPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return "-";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

const columns: Column[] = [
  { header: "Route Group", key: "route_group" },
  { header: "Route Name", key: "route_name" },
  { header: "Path Template", key: "path_template" },
  {
    header: "PV",
    key: "page_view_count",
    render: (value) => formatNumber(value),
  },
  {
    header: "방문자(일별 합)",
    key: "visitor_count",
    render: (value) => formatNumber(value),
  },
  {
    header: "세션(일별 합)",
    key: "session_count",
    render: (value) => formatNumber(value),
  },
  {
    header: "평균 활성 구간(이벤트)",
    key: "active_dwell_avg_ms",
    render: (value) => formatDuration(value),
  },
  {
    header: "총 활성 체류",
    key: "active_dwell_total_ms",
    render: (value) => formatDuration(value),
  },
  {
    header: "짧은 체류",
    key: "short_dwell_count",
    render: (value, row: IStatisticSitePageRoute) =>
      `${formatNumber(value)} (${formatPercent(value || 0, row.dwell_event_count || 0)})`,
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(() => subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());
  const [routeGroup, setRouteGroup] = useState("all");

  const queryParams = useMemo(
    () => ({
      page,
      count_per_page: item_per_page,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      route_group: routeGroup === "all" ? undefined : routeGroup,
    }),
    [endDate, page, routeGroup, startDate]
  );

  const {
    data,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticSitePageRoutes(queryParams);

  const summary = data?.summary;
  const totalPages = calculatePageCount(data?.total_count || 0, item_per_page);

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="페이지뷰 상세 분석" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SearchByDateRange
              startDate={startDate}
              endDate={endDate}
              setStartDate={(date) => {
                setStartDate(date);
                setPage(1);
              }}
              setEndDate={(date) => {
                setEndDate(date);
                setPage(1);
              }}
            />
            <Select
              value={routeGroup}
              onValueChange={(value) => {
                setRouteGroup(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routeGroupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">PV</div>
            <div className="mt-1 text-lg font-semibold">
              {formatNumber(summary?.page_view_count)}
            </div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">방문자(일별 합)</div>
            <div className="mt-1 text-lg font-semibold">
              {formatNumber(summary?.visitor_count)}
            </div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">세션(일별 합)</div>
            <div className="mt-1 text-lg font-semibold">
              {formatNumber(summary?.session_count)}
            </div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">평균 활성 구간(이벤트)</div>
            <div className="mt-1 text-lg font-semibold">
              {formatDuration(summary?.active_dwell_avg_ms)}
            </div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">총 활성 체류</div>
            <div className="mt-1 text-lg font-semibold">
              {formatDuration(summary?.active_dwell_total_ms)}
            </div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">짧은 체류</div>
            <div className="mt-1 text-lg font-semibold">
              {formatPercent(summary?.short_dwell_count || 0, summary?.dwell_event_count || 0)}
            </div>
          </div>
        </div>

        <CommonTable
          columns={columns}
          data={data?.results ?? []}
          loading={isLoadingData || isFetching}
          emptyMessage="페이지뷰 상세 데이터가 없습니다."
        />
        <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
        <FullPageLoader isLoading={isLoadingData || isFetching} />
      </div>
    </SidebarInset>
  );
}

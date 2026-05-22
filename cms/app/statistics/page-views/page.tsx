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
import { useGetStatisticSitePageRoutes } from "@/api/statistic";
import { calculatePageCount } from "@/lib/utils";
import { IStatisticSitePageRoute } from "@/types/statistic";

const pageViewRoutesPerPage = 30;

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
  { value: "mypage", label: "마이페이지" },
  { value: "auth", label: "인증" },
  { value: "payment", label: "결제" },
  { value: "author", label: "작가" },
  { value: "notice", label: "공지" },
  { value: "faq", label: "FAQ" },
  { value: "legal", label: "약관" },
  { value: "system", label: "시스템" },
  { value: "support", label: "고객센터" },
  { value: "message", label: "메시지" },
  { value: "preference", label: "취향" },
  { value: "present", label: "선물함" },
  { value: "vote", label: "투표" },
  { value: "unknown", label: "미분류" },
];

const routeTermDescriptions = [
  {
    label: "경로 그룹",
    description:
      "페이지를 운영 관점의 큰 묶음으로 나눈 값입니다. 필터와 상위 비교 기준으로 씁니다.",
  },
  {
    label: "경로 이름",
    description:
      "같은 그룹 안에서 실제 화면 종류를 더 자세히 구분한 값입니다. 예: viewer_episode, event_detail",
  },
  {
    label: "경로 템플릿",
    description:
      "작품 ID, 회차 ID처럼 매번 달라지는 값을 [id] 또는 *로 치환한 표준 경로입니다. 예: /viewer/[id]",
  },
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
  { header: "경로 그룹", key: "route_group" },
  { header: "경로 이름", key: "route_name" },
  { header: "경로 템플릿", key: "path_template" },
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
      count_per_page: pageViewRoutesPerPage,
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
  const totalPages = calculatePageCount(data?.total_count || 0, pageViewRoutesPerPage);

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

        <div className="rounded-md border bg-background p-4 text-sm">
          <div className="grid gap-3">
            {routeTermDescriptions.map((item) => (
              <div key={item.label} className="grid grid-cols-[120px_1fr] gap-3">
                <div className="font-medium text-foreground">{item.label}</div>
                <div className="text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="font-medium text-foreground">수집 가능한 경로 그룹</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {routeGroupOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <span key={option.value}>
                    {option.label}({option.value})
                  </span>
                ))}
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

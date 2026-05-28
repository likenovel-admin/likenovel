"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStatisticSitePageReferrersDownload,
  useGetStatisticSitePageReferrers,
} from "@/api/statistic";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IStatisticSitePageReferrer } from "@/types/statistic";
import {
  defaultReferrerSortBy,
  defaultTrafficSignal,
  formatReferrerDateTime,
  getReferrerGroupCompatibilityHint,
  isReferrerGroupDisabledForTrafficSignal,
  normalizeReferrerGroupForTrafficSignal,
  referrerSortOptions,
  trafficSignalOptions,
} from "./referrerFilters";

const referrersPerPage = 30;

const referrerGroupOptions = [
  { value: "all", label: "전체" },
  { value: "instagram", label: "인스타" },
  { value: "threads", label: "스레드" },
  { value: "x", label: "X" },
  { value: "naver", label: "네이버" },
  { value: "google", label: "구글" },
  { value: "direct", label: "직접/미확인" },
  { value: "internal", label: "내부" },
  { value: "other", label: "기타" },
  { value: "unknown", label: "미분류" },
];

const routeGroupOptions = [
  { value: "all", label: "전체 경로" },
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

const referrerGroupLabelMap = new Map([
  ...referrerGroupOptions.map((option) => [option.value, option.label] as const),
  ["twitter", "X"],
]);
const routeGroupLabelMap = new Map(
  routeGroupOptions.map((option) => [option.value, option.label])
);

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatNullable(value: unknown) {
  const text = String(value || "").trim();
  return text || "-";
}

function formatReferrerGroup(value: unknown) {
  const referrerGroup = String(value || "");
  return referrerGroupLabelMap.get(referrerGroup) ?? formatNullable(value);
}

function formatRouteGroup(value: unknown) {
  const routeGroup = String(value || "");
  return routeGroupLabelMap.get(routeGroup) ?? formatNullable(value);
}

const columns: Column[] = [
  {
    header: "유입 그룹",
    key: "referrer_group",
    render: (value) => formatReferrerGroup(value),
  },
  { header: "UTM source", key: "utm_source", render: (value) => formatNullable(value) },
  { header: "UTM campaign", key: "utm_campaign", render: (value) => formatNullable(value) },
  { header: "UTM content", key: "utm_content", render: (value) => formatNullable(value) },
  {
    header: "Referrer host",
    key: "external_referrer_host",
    render: (value) => formatNullable(value),
  },
  {
    header: "경로 그룹",
    key: "route_group",
    render: (value) => formatRouteGroup(value),
  },
  { header: "경로 템플릿", key: "path_template" },
  { header: "유입 후 기록 경로", key: "landing_path" },
  {
    header: "최근 유입",
    key: "last_seen_at",
    render: (value) => formatReferrerDateTime(value),
  },
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
];

export default function Page() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(() => subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());
  const [referrerGroup, setReferrerGroup] = useState("all");
  const [routeGroup, setRouteGroup] = useState("all");
  const [trafficSignal, setTrafficSignal] = useState(defaultTrafficSignal);
  const [sortBy, setSortBy] = useState(defaultReferrerSortBy);
  const [filterNotice, setFilterNotice] = useState<string | null>(null);
  const compatibilityHint = getReferrerGroupCompatibilityHint(trafficSignal);

  const queryParams = useMemo(
    () => ({
      page,
      count_per_page: referrersPerPage,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      referrer_group: referrerGroup === "all" ? undefined : referrerGroup,
      route_group: routeGroup === "all" ? undefined : routeGroup,
      traffic_signal: trafficSignal,
      sort_by: sortBy,
      sort_order: "desc" as const,
    }),
    [endDate, page, referrerGroup, routeGroup, sortBy, startDate, trafficSignal]
  );

  const {
    data,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticSitePageReferrers(queryParams);

  const summary = data?.summary;
  const totalPages = calculatePageCount(data?.total_count || 0, referrersPerPage);

  const downloadParams = useMemo(
    () => ({
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      referrer_group: referrerGroup === "all" ? undefined : referrerGroup,
      route_group: routeGroup === "all" ? undefined : routeGroup,
      traffic_signal: trafficSignal,
      sort_by: sortBy,
      sort_order: "desc" as const,
    }),
    [endDate, referrerGroup, routeGroup, sortBy, startDate, trafficSignal]
  );

  const handleDownloadExcel = async () => {
    await downloadExcel<IStatisticSitePageReferrer>({
      apiFn: getStatisticSitePageReferrersDownload,
      params: downloadParams,
      headers: [
        "유입 그룹",
        "UTM source",
        "UTM medium",
        "UTM campaign",
        "UTM content",
        "Referrer host",
        "경로 그룹",
        "경로 이름",
        "경로 템플릿",
        "유입 후 기록 경로",
        "최근 유입",
        "최초 유입",
        "PV",
        "방문자(일별 합)",
        "세션(일별 합)",
      ],
      fields: [
        (item) => formatReferrerGroup(item.referrer_group),
        (item) => formatNullable(item.utm_source),
        (item) => formatNullable(item.utm_medium),
        (item) => formatNullable(item.utm_campaign),
        (item) => formatNullable(item.utm_content),
        (item) => formatNullable(item.external_referrer_host),
        (item) => formatRouteGroup(item.route_group),
        (item) => formatNullable(item.route_name),
        "path_template",
        "landing_path",
        (item) => formatReferrerDateTime(item.last_seen_at),
        (item) => formatReferrerDateTime(item.first_seen_at),
        (item) => item.page_view_count,
        (item) => item.visitor_count,
        (item) => item.session_count,
      ],
      filename: "Site Page Referrer Statistics",
      onStart: () => setIsDownloading(true),
      onFinish: () => setIsDownloading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="유입경로 분석" />
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
              value={referrerGroup}
              onValueChange={(value) => {
                setReferrerGroup(value);
                setFilterNotice(null);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {referrerGroupOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={isReferrerGroupDisabledForTrafficSignal(
                      option.value,
                      trafficSignal
                    )}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select
              value={trafficSignal}
              onValueChange={(value) => {
                setTrafficSignal(value);
                const nextReferrerGroup = normalizeReferrerGroupForTrafficSignal(
                  referrerGroup,
                  value
                );
                if (nextReferrerGroup !== referrerGroup) {
                  setReferrerGroup(nextReferrerGroup);
                  setFilterNotice(
                    "선택한 유입 신호와 함께 볼 수 있도록 유입 그룹을 '전체'로 변경했습니다."
                  );
                } else {
                  setFilterNotice(null);
                }
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trafficSignalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {referrerSortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(filterNotice || compatibilityHint) && (
          <div className="text-xs text-muted-foreground">
            {filterNotice || compatibilityHint}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
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
        </div>

        <div className="rounded-md border bg-background p-4 text-sm">
          <div className="font-medium text-foreground">집계 기준</div>
          <div className="mt-2 text-muted-foreground">
            기본값은 유입 신호 있음 + 최근 유입순입니다. UTM이 있으면 UTM
            source를 우선으로, 없으면 외부 referrer 그룹으로 묶습니다. PV순은
            뷰어 반복 읽기에 왜곡될 수 있어 트래픽 규모 확인용으로만 선택해서
            봅니다.
          </div>
          <div className="mt-2 text-muted-foreground">
            유입 후 기록 경로는 같은 유입 신호가 붙은 상태로 기록된 페이지
            경로입니다. 게시글 링크를 누른 첫 화면뿐 아니라, 이후 홈, 로그인,
            뷰어로 이동한 페이지뷰도 같은 유입 신호로 묶여 표시됩니다. 이
            경로가 최종 도착지나 이탈 지점을 뜻하지는 않습니다.
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {referrerGroupOptions
              .filter((option) => option.value !== "all")
              .map((option) => (
                <span key={option.value}>
                  {option.label}({option.value})
                </span>
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={handleDownloadExcel}
              disabled={isDownloading}
            >
              엑셀 다운로드
            </Button>
          </div>
          <CommonTable
            columns={columns}
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            emptyMessage="유입경로 데이터가 없습니다."
          />
        </div>
        <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
        <FullPageLoader isLoading={isDownloading || isLoadingData || isFetching} />
      </div>
    </SidebarInset>
  );
}

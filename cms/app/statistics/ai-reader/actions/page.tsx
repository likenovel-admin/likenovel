"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { useGetStatisticAiReaderTimeline } from "@/api/statistic";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { formatAiReaderDisplayName } from "@/lib/ai-reader-display-name";
import { calculatePageCount } from "@/lib/utils";
import { IStatisticAiReaderTimelineAction } from "@/types/statistic";
import {
  aiReaderActionToneClassName,
  formatAiReaderActionScoreLabel,
  formatAiReaderActionStatusLabel,
} from "../_lib";

const TIMELINE_PAGE_SIZE = 50;
type TimelineStatusFilter = "applied" | "pending" | "skipped" | "failed" | "all";

const TIMELINE_STATUS_OPTIONS: Array<{ value: TimelineStatusFilter; label: string }> = [
  { value: "applied", label: "반영" },
  { value: "pending", label: "대기/처리중" },
  { value: "skipped", label: "미반영" },
  { value: "failed", label: "실패" },
  { value: "all", label: "전체" },
];

const numberFormat = (value: unknown) => Number(value || 0).toLocaleString();

const parseDateParam = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatTimelineTime = (value?: string | null) => {
  if (!value) return "---- -- -- --:--";
  return String(value).replace("T", " ").slice(0, 16);
};

const parseStatusFilter = (value: string | null): TimelineStatusFilter => {
  if (value === "pending" || value === "skipped" || value === "failed" || value === "all") {
    return value;
  }
  return "applied";
};

const formatActionText = (row: IStatisticAiReaderTimelineAction) => {
  const type = String(row.action_type || "").toLowerCase();
  if (type === "bookmark") return row.target_value === "N" ? "선호작 1 해제" : "선호작 1 추가";
  if (type === "recommend") return row.target_value === "N" ? "추천 1 해제" : "추천 1 추가";
  if (type === "read") return "조회 1";
  if (type === "evaluate") return "평가 1";
  if (type === "drop") return "드롭 1";
  return row.action_type || "활동";
};

export default function Page() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(() =>
    parseDateParam(searchParams.get("start_date"))
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    parseDateParam(searchParams.get("end_date"))
  );
  const [statusFilter, setStatusFilter] = useState<TimelineStatusFilter>(() =>
    parseStatusFilter(searchParams.get("status_filter"))
  );

  const queryParams = useMemo(
    () => ({
      page,
      count_per_page: TIMELINE_PAGE_SIZE,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      status_filter: statusFilter,
    }),
    [page, startDate, endDate, statusFilter]
  );

  const {
    data,
    refetch,
    isLoading,
    isFetching,
  } = useGetStatisticAiReaderTimeline(queryParams, 30000);

  const handleSearch = () => setPage(1);

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="AI 독자 상세 활동로그" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
          <Link
            href="/statistics/ai-reader"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            운영 대시보드
          </Link>
          <div className="text-xs text-muted-foreground">
            검색 범위/상태 기준 {numberFormat(data?.total_count)}건
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <SearchByDateRange
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
            <Button onClick={handleSearch}>기간 적용</Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              새로고침
            </Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TIMELINE_STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(option.value);
                  setPage(1);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="rounded-md border bg-muted/10">
            {isFetching && !data ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : data?.items && data.items.length > 0 ? (
              <ul className="divide-y">
                {data.items.map((row) => {
                  const readerName = formatAiReaderDisplayName(row.agent_key, row.ai_reader_agent_id);
                  const productTitle = row.product_title || `작품 ${row.product_id}`;
                  return (
                    <li key={row.ai_reader_action_id} className="px-4 py-3 text-xs leading-relaxed">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="tabular-nums text-muted-foreground">
                          [{formatTimelineTime(row.event_time)}]
                        </span>
                        <span className="font-medium">{readerName}</span>
                        <span className="text-muted-foreground">
                          가 &lt;{productTitle}&gt; {formatActionText(row)}
                        </span>
                        <span
                          className={aiReaderActionToneClassName(
                            row.status,
                            row.action_type,
                            row.target_value
                          )}
                        >
                          {formatAiReaderActionScoreLabel(
                            row.action_type,
                            row.target_value,
                            row.status
                          )}
                        </span>
                        {row.status !== "applied" ? (
                          <span className="text-muted-foreground">
                            {formatAiReaderActionStatusLabel(row.status)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>agent {row.ai_reader_agent_id}</span>
                        <span>product {row.product_id}</span>
                        {row.episode_id ? <span>episode {row.episode_id}</span> : null}
                        {(row.age_group || row.gender) ? (
                          <span>{row.age_group || "-"} / {row.gender || "-"}</span>
                        ) : null}
                        <span>action {row.ai_reader_action_id}</span>
                      </div>
                      {row.error_message ? (
                        <div className="mt-1 text-[11px] text-destructive">{row.error_message}</div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                선택한 기간에 활동로그가 없습니다.
              </div>
            )}
          </div>

          <div className="mt-4">
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={calculatePageCount(data?.total_count || 0, TIMELINE_PAGE_SIZE)}
            />
          </div>
        </div>

        <FullPageLoader isLoading={isLoading} />
      </div>
    </SidebarInset>
  );
}

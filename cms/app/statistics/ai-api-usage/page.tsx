"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";

import { useGetStatisticAiApiUsage } from "@/api/statistic";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";

const sourceColumns: Column[] = [
  { header: "구분", key: "source_label" },
  { header: "건수", key: "request_count", render: (value) => formatNumber(value) },
  { header: "성공", key: "success_count", render: (value) => formatNumber(value) },
  { header: "실패", key: "failure_count", render: (value) => formatNumber(value) },
  { header: "정확 비용", key: "exact_cost_usd", render: (value) => formatUsd(value) },
  { header: "추정 비용", key: "estimated_cost_usd", render: (value) => formatUsd(value) },
  { header: "비용 미집계", key: "untracked_count", render: (value) => formatNumber(value) },
  { header: "차감 캐시", key: "charged_cash", render: (value) => formatNumber(value) },
];

const modelColumns: Column[] = [
  { header: "소스", key: "source_key", render: (value) => formatSourceKey(value) },
  { header: "Provider", key: "provider", render: (value) => formatUnknown(value) },
  { header: "모델", key: "model_name", render: (value) => formatUnknown(value) },
  { header: "건수", key: "request_count", render: (value) => formatNumber(value) },
  { header: "정확 비용", key: "exact_cost_usd", render: (value) => formatUsd(value) },
  { header: "추정 비용", key: "estimated_cost_usd", render: (value) => formatUsd(value) },
  { header: "비용 미집계", key: "untracked_count", render: (value) => formatNumber(value) },
];

const sourceKeyLabels: Record<string, string> = {
  dna_batch: "DNA 배치",
  ai_reader_batch: "AI독자 배치",
  websochat_chat: "웹소챗 채팅",
  ai_librarian_chat: "AI사서 채팅",
};

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatUsd(value: unknown) {
  const amount = Number(value || 0);
  if (!amount) return "-";
  return `$${amount.toFixed(6)}`;
}

function formatUnknown(value: unknown) {
  const text = String(value || "");
  return text === "unknown" || !text ? "미집계" : text;
}

function formatSourceKey(value: unknown) {
  const key = String(value || "");
  return sourceKeyLabels[key] ?? key;
}

export default function Page() {
  const [startDate, setStartDate] = useState<Date | null>(() => subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());

  const queryParams = useMemo(
    () => ({
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    }),
    [endDate, startDate]
  );

  const {
    data,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticAiApiUsage(queryParams);
  const summary = data?.summary;
  const isLoading = isLoadingData || isFetching;

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="API 사용량" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex items-center gap-3 rounded-lg border bg-white p-4">
          <SearchByDateRange
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <SummaryCard label="전체 건수" value={formatNumber(summary?.request_count)} />
          <SummaryCard label="성공" value={formatNumber(summary?.success_count)} />
          <SummaryCard label="실패" value={formatNumber(summary?.failure_count)} />
          <SummaryCard label="정확 비용" value={formatUsd(summary?.exact_cost_usd)} />
          <SummaryCard label="추정 비용" value={formatUsd(summary?.estimated_cost_usd)} />
          <SummaryCard label="비용 미집계" value={formatNumber(summary?.untracked_count)} />
          <SummaryCard label="차감 캐시" value={formatNumber(summary?.charged_cash)} />
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          비용은 정확 비용, 추정 비용, 미집계로 분리합니다. 웹소챗/AI사서는 현재 provider token/cost 로그가 없어 건수만 집계하고
          비용은 미집계로 표시합니다.
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">기능별 사용량</h2>
          <CommonTable
            columns={sourceColumns}
            data={data?.results || []}
            loading={isLoading}
            emptyMessage="AI API 사용량 데이터가 없습니다."
          />
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Provider / 모델별 사용량</h2>
          <CommonTable
            columns={modelColumns}
            data={data?.model_summary || []}
            loading={isLoading}
            emptyMessage="모델별 사용량 데이터가 없습니다."
          />
        </div>

        <FullPageLoader isLoading={isLoading} />
      </div>
    </SidebarInset>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

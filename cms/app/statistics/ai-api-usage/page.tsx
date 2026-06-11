"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { RefreshCw } from "lucide-react";

import {
  useGetStatisticAiApiUsage,
  usePostStatisticAiProviderHealthCheck,
} from "@/api/statistic";
import { IStatisticAiProviderHealth } from "@/types/statistic";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import { Button } from "@/components/ui/button";
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

const providerStatusLabels: Record<string, string> = {
  ok: "정상",
  not_checked: "미확인",
  not_configured: "설정 없음",
  credit_depleted: "크레딧 부족",
  rate_limited: "한도 제한",
  auth_failed: "인증 실패",
  timeout: "타임아웃",
  provider_error: "공급자 오류",
  unknown_error: "알 수 없음",
};

const providerStatusClasses: Record<string, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_checked: "border-slate-200 bg-slate-50 text-slate-600",
  not_configured: "border-slate-200 bg-slate-50 text-slate-600",
  credit_depleted: "border-red-200 bg-red-50 text-red-700",
  rate_limited: "border-amber-200 bg-amber-50 text-amber-700",
  auth_failed: "border-red-200 bg-red-50 text-red-700",
  timeout: "border-amber-200 bg-amber-50 text-amber-700",
  provider_error: "border-red-200 bg-red-50 text-red-700",
  unknown_error: "border-slate-200 bg-slate-50 text-slate-600",
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function formatStatusLabel(status: string) {
  return providerStatusLabels[status] ?? status;
}

function formatProviderName(value: string) {
  const labels: Record<string, string> = {
    gemini: "Gemini",
    claude: "Claude",
    openrouter: "OpenRouter",
    deepseek: "DeepSeek",
  };
  return labels[value] ?? value;
}

export default function Page() {
  const [startDate, setStartDate] = useState<Date | null>(() => subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());
  const [healthMessage, setHealthMessage] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    }),
    [endDate, startDate]
  );

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticAiApiUsage(queryParams);
  const healthCheckMutation = usePostStatisticAiProviderHealthCheck();
  const summary = data?.summary;
  const isLoading = isLoadingData || isFetching;

  const handleRunHealthCheck = async () => {
    setHealthMessage(null);
    try {
      await healthCheckMutation.mutateAsync();
      await refetch();
      setHealthMessage("AI Provider 상태 점검을 완료했습니다.");
    } catch (error) {
      setHealthMessage(error instanceof Error ? error.message : "AI Provider 상태 점검에 실패했습니다.");
    }
  };

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

        <ProviderHealthPanel
          rows={data?.provider_health || []}
          isChecking={healthCheckMutation.isPending}
          message={healthMessage}
          onCheck={handleRunHealthCheck}
        />

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

function ProviderHealthPanel({
  rows,
  isChecking,
  message,
  onCheck,
}: {
  rows: IStatisticAiProviderHealth[];
  isChecking: boolean;
  message: string | null;
  onCheck: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">AI Provider 상태</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            헬스체크 호출은 사용량/비용 합계에 포함하지 않습니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCheck} disabled={isChecking}>
          <RefreshCw className={isChecking ? "animate-spin" : ""} />
          상태 점검
        </Button>
      </div>
      {message && <div className="mb-3 text-xs text-muted-foreground">{message}</div>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.length ? (
          rows.map((row) => (
            <ProviderHealthCard key={row.provider} row={row} />
          ))
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            AI Provider 상태 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderHealthCard({ row }: { row: IStatisticAiProviderHealth }) {
  const statusClass = providerStatusClasses[row.status] ?? providerStatusClasses.unknown_error;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{formatProviderName(row.provider)}</div>
          <div className="mt-1 break-words text-xs text-muted-foreground">{row.model || "-"}</div>
        </div>
        <span className={`whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${statusClass}`}>
          {formatStatusLabel(row.status)}
        </span>
      </div>
      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <div>최근 점검: {formatDateTime(row.checked_at)}</div>
        <div>최근 성공: {formatDateTime(row.last_success_at)}</div>
        <div>응답 시간: {row.latency_ms == null ? "-" : `${formatNumber(row.latency_ms)}ms`}</div>
        <div>영향 기능: {row.affected_features || "-"}</div>
        {(row.error_code || row.error_message) && (
          <div className="break-words text-red-600">
            {[row.error_code, row.error_message].filter(Boolean).join(" / ")}
          </div>
        )}
      </div>
    </div>
  );
}

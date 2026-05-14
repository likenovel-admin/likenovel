"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { useGetAiReaderAgents, useUpdateAiReaderSchedule } from "@/api/aiReader";
import { IAiReaderAgent } from "@/api/aiReader/dto";
import {
  useGetStatisticAiReaderAgentActions,
  useGetStatisticAiReaderEngagement,
} from "@/api/statistic";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { formatAiReaderDisplayName } from "@/lib/ai-reader-display-name";
import { calculatePageCount } from "@/lib/utils";
import {
  aiReaderActionToneClassName,
  formatAiReaderActionScoreLabel,
  formatAiReaderActionStatusLabel,
} from "../_lib";

const numberFormat = (value: unknown) => Number(value || 0).toLocaleString();

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
};

const formatHours = (hours?: number[]) => {
  if (!hours?.length) return "-";
  return hours.map((hour) => `${String(hour).padStart(2, "0")}시`).join(", ");
};

const parseHoursInput = (value: string) => {
  const hours = value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
  if (!hours.length || hours.some((hour) => !Number.isInteger(hour) || hour < 0 || hour > 23)) {
    throw new Error("활동 시간은 0~23 숫자를 쉼표로 입력하세요.");
  }
  if (new Set(hours).size !== hours.length) {
    throw new Error("활동 시간에 중복이 있습니다.");
  }
  return [...hours].sort((a, b) => a - b);
};

const genderLabel: Record<string, string> = {
  M: "남성",
  F: "여성",
  X: "기타",
  unknown: "미상",
};

export default function Page() {
  const searchParams = useSearchParams();
  const initialAgentId = (() => {
    const raw = searchParams.get("agent_id");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  })();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [scheduleDateInput, setScheduleDateInput] = useState(format(new Date(), "yyyy-MM-dd"));
  const [agentPage, setAgentPage] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(initialAgentId);
  const [scheduleActiveHoursInput, setScheduleActiveHoursInput] = useState("6,7,12,20,21,22");
  const [scheduleDailySessionTargetInput, setScheduleDailySessionTargetInput] = useState("2");
  const [scheduleDailyLlmBudgetInput, setScheduleDailyLlmBudgetInput] = useState("8");
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [actionsPage, setActionsPage] = useState(1);

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticAiReaderEngagement(
    {
      page,
      count_per_page: item_per_page,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    },
    60000
  );
  const {
    data: agentData,
    refetch: refetchAgents,
    isFetching: isFetchingAgents,
  } = useGetAiReaderAgents({
    schedule_date: scheduleDateInput,
    status: "active",
    page: agentPage,
    count_per_page: 100,
  });
  const scheduleMutation = useUpdateAiReaderSchedule();

  const { data: actionsData, isFetching: isFetchingActions } = useGetStatisticAiReaderAgentActions(
    {
      agent_id: selectedAgentId ?? 0,
      page: actionsPage,
      count_per_page: 50,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    },
    selectedAgentId !== null
  );

  const handleSearch = () => setPage(1);

  const formatActionLabel = (type: string, target: string | null | undefined) => {
    if (type === "recommend") return target === "N" ? "추천 해제" : "추천";
    if (type === "bookmark") return target === "N" ? "선호 해제" : "선호 추가";
    if (type === "read") return "조회";
    if (type === "evaluate") return "평가";
    if (type === "drop") return "드롭";
    return type || "-";
  };

  const refreshAll = async () => {
    await Promise.all([refetch(), refetchAgents()]);
  };

  const handleSelectAgent = (agent: IAiReaderAgent) => {
    setSelectedAgentId(agent.ai_reader_agent_id);
    setScheduleActiveHoursInput((agent.active_hours || []).join(","));
    setScheduleDailySessionTargetInput(String(agent.daily_session_target || 2));
    setScheduleDailyLlmBudgetInput(String(agent.daily_llm_budget || 8));
    setActionsPage(1);
    setOperationMessage(`${formatAiReaderDisplayName(agent.agent_key, agent.ai_reader_agent_id)} 선택됨`);
  };

  const handleAgentPageChange = (nextPage: number) => {
    setAgentPage(nextPage);
    setSelectedAgentId(null);
    setActionsPage(1);
  };

  const handleApplySchedule = async () => {
    try {
      if (!selectedAgentId) {
        setOperationMessage("스케줄을 조정할 AI 독자를 먼저 선택하세요.");
        return;
      }
      setOperationMessage(null);
      const activeHours = parseHoursInput(scheduleActiveHoursInput);
      const result = await scheduleMutation.mutateAsync({
        aiReaderAgentId: selectedAgentId,
        body: {
          schedule_date: scheduleDateInput,
          active_hours: activeHours,
          daily_session_target: Number(scheduleDailySessionTargetInput || 1),
          daily_llm_budget: Number(scheduleDailyLlmBudgetInput || 8),
          status: "active",
        },
      });
      setOperationMessage(
        `스케줄 적용됨: ${formatAiReaderDisplayName(result.agent.agent_key, result.agent.ai_reader_agent_id)} / 삭제 ${numberFormat(result.deleted_schedule_count)} / 생성 ${numberFormat(result.upserted_schedule_count)}`
      );
      await refreshAll();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "스케줄 적용에 실패했습니다.");
    }
  };

  const agentColumns: Column[] = [
    {
      header: "AI 독자",
      key: "agent_key",
      render: (_value, row) => (
        <div>
          <div className="font-medium">
            {formatAiReaderDisplayName(row.agent_key, row.ai_reader_agent_id)}
          </div>
          <div className="text-xs text-muted-foreground">ID {row.ai_reader_agent_id}</div>
        </div>
      ),
    },
    {
      header: "코호트",
      key: "cohort",
      render: (_value, row) =>
        `${row.age_group || "-"} / ${genderLabel[String(row.gender)] || row.gender || "-"}`,
    },
    { header: "활동 시간", key: "active_hours", render: (value) => formatHours(value as number[]) },
    { header: "세션 목표", key: "daily_session_target", render: numberFormat },
    { header: "오늘 스케줄", key: "schedule_window_count", render: numberFormat },
    {
      header: "사용",
      key: "used_session_count",
      render: (_value, row) =>
        `${numberFormat(row.used_session_count)} / ${numberFormat(row.schedule_session_budget)}`,
    },
    {
      header: "첫/마지막",
      key: "schedule_range",
      render: (_value, row) =>
        `${formatDateTime(row.first_active_start_at)} ~ ${formatDateTime(row.last_active_end_at)}`,
    },
    {
      header: "조정",
      key: "actions",
      render: (_value, row) => (
        <Button
          size="sm"
          variant={selectedAgentId === row.ai_reader_agent_id ? "default" : "outline"}
          onClick={() => handleSelectAgent(row as IAiReaderAgent)}
        >
          {selectedAgentId === row.ai_reader_agent_id ? "선택됨" : "선택"}
        </Button>
      ),
    },
  ];

  const hourlyColumns: Column[] = [
    { header: "시", key: "hour", render: (value) => `${String(value).padStart(2, "0")}시` },
    { header: "조회", key: "read_count", render: numberFormat },
    { header: "추천", key: "recommend_count", render: numberFormat },
    { header: "추천 해제", key: "unrecommend_count", render: numberFormat },
    { header: "선호", key: "bookmark_count", render: numberFormat },
    { header: "선호 해제", key: "unbookmark_count", render: numberFormat },
    { header: "평가", key: "evaluation_count", render: numberFormat },
    { header: "드롭", key: "drop_count", render: numberFormat },
  ];

  const cohortColumns: Column[] = [
    { header: "나이대", key: "age_group" },
    { header: "성별", key: "gender", render: (value) => genderLabel[String(value)] || value || "-" },
    { header: "조회", key: "read_count", render: numberFormat },
    { header: "추천", key: "recommend_count", render: numberFormat },
    { header: "추천 해제", key: "unrecommend_count", render: numberFormat },
    { header: "선호", key: "bookmark_count", render: numberFormat },
    { header: "선호 해제", key: "unbookmark_count", render: numberFormat },
    { header: "평가", key: "evaluation_count", render: numberFormat },
    { header: "드롭", key: "drop_count", render: numberFormat },
  ];

  const actionColumns: Column[] = [
    { header: "시각", key: "created_date", render: formatDateTime },
    {
      header: "행위",
      key: "action_type",
      render: (value, row) => (
        <span className="font-medium">{formatActionLabel(String(value || ""), row.target_value)}</span>
      ),
    },
    {
      header: "활동점수",
      key: "action_score",
      render: (_value, row) => (
        <span className={aiReaderActionToneClassName(row.status, row.action_type, row.target_value)}>
          {formatAiReaderActionScoreLabel(row.action_type, row.target_value, row.status)}
        </span>
      ),
    },
    { header: "작품 ID", key: "product_id" },
    { header: "회차", key: "episode_id", render: (value) => value || "-" },
    {
      header: "상태",
      key: "status",
      render: (value) => (
        <span className={aiReaderActionToneClassName(String(value || ""), undefined, undefined)}>
          {formatAiReaderActionStatusLabel(String(value || ""))}
        </span>
      ),
    },
    { header: "적용 시각", key: "applied_at", render: formatDateTime },
    {
      header: "에러",
      key: "error_message",
      render: (value) => (
        <div className="max-w-[280px] truncate" title={String(value || "")}>
          {value || "-"}
        </div>
      ),
    },
  ];

  const errorColumns: Column[] = [
    { header: "시각", key: "event_time", render: formatDateTime },
    { header: "구분", key: "source" },
    { header: "AI 독자 ID", key: "ai_reader_agent_id" },
    { header: "작품", key: "product_id" },
    { header: "Action", key: "action_type" },
    { header: "모델", key: "model_name" },
    {
      header: "에러",
      key: "error_message",
      render: (value) => (
        <div className="max-w-[360px] truncate" title={String(value || "")}>
          {value || "-"}
        </div>
      ),
    },
  ];

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="AI 독자 개별 관리" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
          <Link
            href="/statistics/ai-reader"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            운영 대시보드
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">스케줄 날짜</span>
            <Input
              type="date"
              value={scheduleDateInput}
              onChange={(e) => {
                setScheduleDateInput(e.target.value);
                setAgentPage(1);
                setSelectedAgentId(null);
              }}
              className="w-[160px]"
            />
            <Button variant="outline" size="sm" onClick={() => refetchAgents()} disabled={isFetchingAgents}>
              <RefreshCw className="mr-2 h-4 w-4" />
              목록 갱신
            </Button>
          </div>
        </div>

        {selectedAgentId && (
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">선택 AI 독자 스케줄 조정</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  선택한 날짜의 미사용 ready 스케줄만 교체합니다. ID {selectedAgentId} / 날짜 {scheduleDateInput}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAgentId(null)}>
                선택 해제
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <Input
                className="md:col-span-2"
                placeholder="활동 시간 예: 6,7,20,21"
                value={scheduleActiveHoursInput}
                onChange={(e) => setScheduleActiveHoursInput(e.target.value)}
              />
              <Input
                inputMode="numeric"
                placeholder="세션 목표"
                value={scheduleDailySessionTargetInput}
                onChange={(e) => setScheduleDailySessionTargetInput(e.target.value.replace(/\D/g, ""))}
              />
              <Input
                inputMode="numeric"
                placeholder="LLM 예산"
                value={scheduleDailyLlmBudgetInput}
                onChange={(e) => setScheduleDailyLlmBudgetInput(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleApplySchedule} disabled={scheduleMutation.isPending}>
                스케줄 적용
              </Button>
            </div>
            {operationMessage && (
              <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs">{operationMessage}</div>
            )}
          </div>
        )}

        {selectedAgentId && (
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">선택 AI 독자 활동 내역</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  ai_reader_agent_id {selectedAgentId} / 검색 범위 기준 {numberFormat(actionsData?.total_count)}건
                </p>
              </div>
            </div>
            <CommonTable
              columns={actionColumns}
              data={actionsData?.items || []}
              loading={isFetchingActions}
              emptyMessage="해당 기간에 활동 내역이 없습니다."
            />
            <div className="mt-4">
              <PaginationControls
                page={actionsPage}
                setPage={setActionsPage}
                totalPages={calculatePageCount(actionsData?.total_count || 0, 50)}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              AI 독자 목록 <span className="text-muted-foreground">{numberFormat(agentData?.total_count)}명</span>
            </h2>
            {!selectedAgentId && operationMessage && (
              <span className="text-xs text-muted-foreground">{operationMessage}</span>
            )}
          </div>
          <CommonTable
            columns={agentColumns}
            data={agentData?.items || []}
            loading={isFetchingAgents}
            emptyMessage="AI 독자 데이터가 없습니다."
          />
          <div className="mt-4">
            <PaginationControls
              page={agentPage}
              setPage={handleAgentPageChange}
              totalPages={calculatePageCount(agentData?.total_count || 0, 100)}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
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
          <h2 className="mb-3 text-sm font-semibold">활동 분포와 문제 로그</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">시간대 활동</h3>
              <CommonTable
                columns={hourlyColumns}
                data={data?.hourly_summary || []}
                loading={isLoadingData || isFetching}
                emptyMessage="시간대 활동이 없습니다."
              />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">나이대/성별</h3>
              <CommonTable
                columns={cohortColumns}
                data={data?.cohort_summary || []}
                loading={isLoadingData || isFetching}
                emptyMessage="코호트 데이터가 없습니다."
              />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">최근 문제 로그</h3>
              <CommonTable
                columns={errorColumns}
                data={data?.recent_errors || []}
                loading={isLoadingData || isFetching}
                emptyMessage="최근 실패 로그가 없습니다."
              />
            </div>
          </div>
        </div>

        <FullPageLoader isLoading={isLoadingData} />
      </div>
    </SidebarInset>
  );
}

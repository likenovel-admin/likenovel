"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, CirclePause, Play, RefreshCw, X } from "lucide-react";

import {
  useBootstrapAiReaderAgents,
  useGetAiReaderAgents,
  usePauseAllAiReaderAgents,
  useResumePausedAiReaderAgents,
} from "@/api/aiReader";
import { IAiReaderBootstrapResponse, IAiReaderResumePausedResponse } from "@/api/aiReader/dto";
import { useGetStatisticAiReaderEngagement } from "@/api/statistic";
import { IGetStatisticAiReaderEngagementParams } from "@/api/statistic/dto";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import SearchByDateRange from "@/components/common/SearchByDateRange";
import AiReaderHourlyBarChart from "@/components/items/chart/ai-reader-hourly-barchart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { calculatePageCount } from "@/lib/utils";

const numberFormat = (value: unknown) => Number(value || 0).toLocaleString();

const percentFormat = (part: unknown, total: unknown) => {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  if (!denominator) return "-";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
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

const MAX_AI_READER_AGENT_COUNT = 100;
const AI_READER_PRESET_STORAGE_KEY = "likenovel.cms.aiReader.customPresets.v1";

type AiReaderIntensity = "LOW" | "MEDIUM" | "HIGH";
type RatioMap = Record<string, number>;

type AiReaderPreset = {
  id: string;
  name: string;
  locked?: boolean;
  intensity: AiReaderIntensity;
  agentCount: number;
  activeHours: number[];
  dailySessionTarget: number;
  dailyLlmBudget: number;
  ageGroupRatios: RatioMap;
  genderRatios: RatioMap;
};

const ageGroupLabel: Record<string, string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
};

const ageGroupKeys = ["10s", "20s", "30s", "40s", "50s"];
const genderKeys = ["M", "F"];

const genderLabel: Record<string, string> = {
  M: "남성",
  F: "여성",
};

const defaultAgeGroupRatios: RatioMap = {
  "10s": 8,
  "20s": 23,
  "30s": 36,
  "40s": 29,
  "50s": 4,
};

const defaultGenderRatios: RatioMap = {
  M: 52,
  F: 48,
};

const intensityDefaults: Record<
  AiReaderIntensity,
  Pick<AiReaderPreset, "activeHours" | "dailySessionTarget" | "dailyLlmBudget">
> = {
  LOW: { activeHours: [7, 12, 20, 21], dailySessionTarget: 1, dailyLlmBudget: 4 },
  MEDIUM: { activeHours: [6, 7, 12, 20, 21, 22], dailySessionTarget: 2, dailyLlmBudget: 8 },
  HIGH: {
    activeHours: [6, 7, 8, 12, 18, 19, 20, 21, 22, 23],
    dailySessionTarget: 4,
    dailyLlmBudget: 12,
  },
};

const defaultPresets: AiReaderPreset[] = [
  {
    id: "default-low",
    name: "프리셋1 LOW",
    locked: true,
    intensity: "LOW",
    agentCount: 50,
    ageGroupRatios: defaultAgeGroupRatios,
    genderRatios: defaultGenderRatios,
    ...intensityDefaults.LOW,
  },
  {
    id: "default-medium",
    name: "프리셋2 MEDIUM",
    locked: true,
    intensity: "MEDIUM",
    agentCount: 100,
    ageGroupRatios: defaultAgeGroupRatios,
    genderRatios: defaultGenderRatios,
    ...intensityDefaults.MEDIUM,
  },
  {
    id: "default-high",
    name: "프리셋3 HIGH",
    locked: true,
    intensity: "HIGH",
    agentCount: 100,
    ageGroupRatios: defaultAgeGroupRatios,
    genderRatios: defaultGenderRatios,
    ...intensityDefaults.HIGH,
  },
];

const sumRatios = (ratios: RatioMap) =>
  Object.values(ratios).reduce((sum, value) => sum + Number(value || 0), 0);

const readCustomPresets = (): AiReaderPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_READER_PRESET_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === "string" && typeof item.name === "string"
    );
  } catch {
    return [];
  }
};

const writeCustomPresets = (presets: AiReaderPreset[]) => {
  window.localStorage.setItem(AI_READER_PRESET_STORAGE_KEY, JSON.stringify(presets));
};

type LastDryRun = {
  emailPrefix: string;
  agentCount: number;
  scheduleDate: string;
  dailyLlmBudget: number;
  activeHours: number[];
  dailySessionTarget: number;
  ageGroupRatios: RatioMap;
  genderRatios: RatioMap;
  token: string;
  availableUserCount: number;
  missingUserCount: number;
  preview: NonNullable<IAiReaderBootstrapResponse["preview"]>;
};

type LastResumeDryRun = {
  agentCount: number;
  scheduleDate: string;
  token: string;
  availableAgentCount: number;
  missingAgentCount: number;
  preview: NonNullable<IAiReaderResumePausedResponse["preview"]>;
};

export default function Page() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [productIdInput, setProductIdInput] = useState("");
  const [productId, setProductId] = useState<number | undefined>(undefined);
  const [scheduleDateInput, setScheduleDateInput] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bootstrapPrefix, setBootstrapPrefix] = useState("ai-reader-");
  const [bootstrapCount, setBootstrapCount] = useState("100");
  const [resumeCount, setResumeCount] = useState("100");
  const [selectedPresetId, setSelectedPresetId] = useState("default-medium");
  const [customPresets, setCustomPresets] = useState<AiReaderPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [intensity, setIntensity] = useState<AiReaderIntensity>("MEDIUM");
  const [activeHoursInput, setActiveHoursInput] = useState("6,7,12,20,21,22");
  const [dailySessionTargetInput, setDailySessionTargetInput] = useState("2");
  const [dailyLlmBudgetInput, setDailyLlmBudgetInput] = useState("8");
  const [ageGroupRatios, setAgeGroupRatios] = useState<RatioMap>(defaultAgeGroupRatios);
  const [genderRatios, setGenderRatios] = useState<RatioMap>(defaultGenderRatios);
  const [lastDryRun, setLastDryRun] = useState<LastDryRun | null>(null);
  const [lastResumeDryRun, setLastResumeDryRun] = useState<LastResumeDryRun | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hourlyTab, setHourlyTab] = useState<"past" | "upcoming">("past");

  useEffect(() => {
    setCustomPresets(readCustomPresets());
  }, []);

  const queryParams = useMemo<IGetStatisticAiReaderEngagementParams>(
    () => ({
      page,
      count_per_page: item_per_page,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      product_id: productId,
    }),
    [page, startDate, endDate, productId]
  );

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticAiReaderEngagement(queryParams, 60000);
  const { refetch: refetchAgents } = useGetAiReaderAgents({
    schedule_date: scheduleDateInput,
    status: "active",
    page: 1,
    count_per_page: 100,
  });
  const bootstrapMutation = useBootstrapAiReaderAgents();
  const pauseAllMutation = usePauseAllAiReaderAgents();
  const resumePausedMutation = useResumePausedAiReaderAgents();

  const bootstrapCountValue = Number(bootstrapCount || 0);
  const resumeCountValue = Number(resumeCount || 0);
  const dailyLlmBudgetValue = Number(dailyLlmBudgetInput || 8);
  const dailySessionTargetValue = Number(dailySessionTargetInput || 1);
  const allPresets = useMemo(() => [...defaultPresets, ...customPresets], [customPresets]);
  const activeHoursValue = useMemo(() => {
    try {
      return parseHoursInput(activeHoursInput);
    } catch {
      return [];
    }
  }, [activeHoursInput]);
  const ageGroupRatioTotal = sumRatios(ageGroupRatios);
  const genderRatioTotal = sumRatios(genderRatios);
  const estimatedDailySessions = bootstrapCountValue * dailySessionTargetValue;
  const estimatedDailyLlmBudget = bootstrapCountValue * dailyLlmBudgetValue;
  const lastDryRunEstimatedScheduleCount = lastDryRun
    ? lastDryRun.availableUserCount * lastDryRun.dailySessionTarget
    : 0;
  const hasMatchingDryRun = Boolean(
    lastDryRun
      && lastDryRun.emailPrefix === bootstrapPrefix
      && lastDryRun.agentCount === bootstrapCountValue
      && lastDryRun.scheduleDate === scheduleDateInput
      && lastDryRun.dailyLlmBudget === dailyLlmBudgetValue
      && lastDryRun.dailySessionTarget === dailySessionTargetValue
      && JSON.stringify(lastDryRun.activeHours) === JSON.stringify(activeHoursValue)
      && JSON.stringify(lastDryRun.ageGroupRatios) === JSON.stringify(ageGroupRatios)
      && JSON.stringify(lastDryRun.genderRatios) === JSON.stringify(genderRatios)
      && lastDryRun.token
      && lastDryRun.missingUserCount === 0
  );
  const hasMatchingResumeDryRun = Boolean(
    lastResumeDryRun
      && lastResumeDryRun.agentCount === resumeCountValue
      && lastResumeDryRun.scheduleDate === scheduleDateInput
      && lastResumeDryRun.token
      && lastResumeDryRun.missingAgentCount === 0
  );

  const handleSearch = () => {
    setPage(1);
    setProductId(productIdInput ? Number(productIdInput) : undefined);
  };

  const resetDryRun = () => setLastDryRun(null);
  const resetResumeDryRun = () => setLastResumeDryRun(null);

  const applyPreset = (preset: AiReaderPreset) => {
    setSelectedPresetId(preset.id);
    setIntensity(preset.intensity);
    setBootstrapCount(String(preset.agentCount));
    setActiveHoursInput(preset.activeHours.join(","));
    setDailySessionTargetInput(String(preset.dailySessionTarget));
    setDailyLlmBudgetInput(String(preset.dailyLlmBudget));
    setAgeGroupRatios({ ...preset.ageGroupRatios });
    setGenderRatios({ ...preset.genderRatios });
    resetDryRun();
    setOperationMessage(`${preset.name} 적용됨`);
  };

  const handleIntensityChange = (nextIntensity: AiReaderIntensity) => {
    const defaults = intensityDefaults[nextIntensity];
    setIntensity(nextIntensity);
    setActiveHoursInput(defaults.activeHours.join(","));
    setDailySessionTargetInput(String(defaults.dailySessionTarget));
    setDailyLlmBudgetInput(String(defaults.dailyLlmBudget));
    resetDryRun();
  };

  const handleAddPreset = () => {
    try {
      const activeHours = parseHoursInput(activeHoursInput);
      const name = presetNameInput.trim() || `프리셋 ${customPresets.length + 4}`;
      if (bootstrapCountValue < 1 || bootstrapCountValue > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`투입 수는 1~${MAX_AI_READER_AGENT_COUNT}명까지 가능합니다.`);
        return;
      }
      if (ageGroupRatioTotal !== 100 || genderRatioTotal !== 100) {
        setOperationMessage("연령/성별 비율 합계는 각각 100이어야 합니다.");
        return;
      }
      const nextPreset: AiReaderPreset = {
        id: `custom-${Date.now()}`,
        name,
        intensity,
        agentCount: bootstrapCountValue,
        activeHours,
        dailySessionTarget: dailySessionTargetValue,
        dailyLlmBudget: dailyLlmBudgetValue,
        ageGroupRatios: { ...ageGroupRatios },
        genderRatios: { ...genderRatios },
      };
      const nextPresets = [...customPresets, nextPreset];
      setCustomPresets(nextPresets);
      writeCustomPresets(nextPresets);
      setSelectedPresetId(nextPreset.id);
      setPresetNameInput("");
      setOperationMessage(`${name} 저장됨`);
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "프리셋 저장에 실패했습니다.");
    }
  };

  const handleDeleteCustomPreset = (preset: AiReaderPreset) => {
    if (preset.locked) {
      setOperationMessage("기본 프리셋은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`${preset.name} 프리셋을 삭제할까요?`)) return;
    const nextPresets = customPresets.filter((item) => item.id !== preset.id);
    setCustomPresets(nextPresets);
    writeCustomPresets(nextPresets);
    if (selectedPresetId === preset.id) {
      applyPreset(defaultPresets[1]);
    }
    setOperationMessage(`${preset.name} 삭제됨`);
  };

  const handleRatioChange = (
    setter: (nextValue: RatioMap) => void,
    currentValue: RatioMap,
    key: string,
    rawValue: string
  ) => {
    const nextNumber = Math.max(0, Math.min(100, Number(rawValue.replace(/\D/g, "") || 0)));
    setter({ ...currentValue, [key]: nextNumber });
    resetDryRun();
  };

  const refreshAiReaderState = async () => {
    await Promise.all([refetch(), refetchAgents()]);
  };

  const handleBootstrap = async (apply: boolean) => {
    try {
      setOperationMessage(null);
      const agentCount = bootstrapCountValue;
      const activeHours = parseHoursInput(activeHoursInput);
      if (!bootstrapPrefix.trim() || agentCount < 1 || agentCount > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(
          `이메일 prefix와 투입 수를 확인하세요. 투입 수는 최대 ${MAX_AI_READER_AGENT_COUNT}명입니다.`
        );
        return;
      }
      if (dailySessionTargetValue < 1 || dailySessionTargetValue > 8) {
        setOperationMessage("세션 목표는 1~8 사이로 입력하세요.");
        return;
      }
      if (dailyLlmBudgetValue < 1 || dailyLlmBudgetValue > 20) {
        setOperationMessage("LLM 예산은 1~20 사이로 입력하세요.");
        return;
      }
      if (ageGroupRatioTotal !== 100 || genderRatioTotal !== 100) {
        setOperationMessage("연령/성별 비율 합계는 각각 100이어야 합니다.");
        return;
      }
      if (apply && !hasMatchingDryRun) {
        setOperationMessage(
          "같은 prefix/투입 수/날짜/활동량/비율/LLM 예산으로 사전 확인을 먼저 통과해야 적용할 수 있습니다."
        );
        return;
      }
      if (
        apply
          && !window.confirm("AI 전용 계정을 AI 독자로 등록하고 스케줄을 생성합니다. 진행할까요?")
      ) {
        return;
      }
      const result = await bootstrapMutation.mutateAsync({
        email_prefix: bootstrapPrefix,
        agent_count: agentCount,
        schedule_date: scheduleDateInput,
        apply,
        daily_llm_budget: dailyLlmBudgetValue,
        active_hours: activeHours,
        daily_session_target: dailySessionTargetValue,
        age_group_ratios: ageGroupRatios,
        gender_ratios: genderRatios,
        dry_run_token: apply ? lastDryRun?.token : undefined,
      });
      if (!apply) {
        setLastDryRun({
          emailPrefix: bootstrapPrefix,
          agentCount,
          scheduleDate: scheduleDateInput,
          dailyLlmBudget: dailyLlmBudgetValue,
          activeHours,
          dailySessionTarget: dailySessionTargetValue,
          ageGroupRatios: { ...ageGroupRatios },
          genderRatios: { ...genderRatios },
          token: result.dry_run_token || "",
          availableUserCount: Number(result.available_user_count || 0),
          missingUserCount: Number(result.missing_user_count || 0),
          preview: result.preview || [],
        });
      }
      setOperationMessage(
        apply
          ? `투입 완료: ${numberFormat(result.applied_count)}명 / 스케줄 ${numberFormat(result.schedule_count)}개`
          : `사전 확인: 사용 가능 ${numberFormat(result.available_user_count)}명 / 부족 ${numberFormat(result.missing_user_count)}명`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "투입 처리에 실패했습니다.");
    }
  };

  const handlePauseAllAgents = async () => {
    if (
      !window.confirm(
        "active AI 독자를 전체 일시정지하고 남은 스케줄/action 대기열을 정리합니다. 진행할까요?"
      )
    ) {
      return;
    }
    try {
      setOperationMessage(null);
      const result = await pauseAllMutation.mutateAsync();
      resetResumeDryRun();
      setOperationMessage(
        `전체 일시정지 완료: 독자 ${numberFormat(result.paused_agent_count)}명 / 스케줄 ${numberFormat(result.retired_schedule_count)}개 / 액션 ${numberFormat(result.cancelled_action_count)}개 정리`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "전체 일시정지에 실패했습니다.");
    }
  };

  const handleResumePausedAgents = async (apply: boolean) => {
    try {
      setOperationMessage(null);
      const agentCount = resumeCountValue;
      if (agentCount < 1 || agentCount > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`재가동 수는 1~${MAX_AI_READER_AGENT_COUNT}명까지 가능합니다.`);
        return;
      }
      if (apply && !hasMatchingResumeDryRun) {
        setOperationMessage("같은 날짜와 재가동 수로 사전 확인을 먼저 통과해야 적용할 수 있습니다.");
        return;
      }
      if (
        apply
          && !window.confirm("paused AI 독자를 active로 전환하고 선택한 날짜의 스케줄을 생성합니다. 진행할까요?")
      ) {
        return;
      }
      const result = await resumePausedMutation.mutateAsync({
        agent_count: agentCount,
        schedule_date: scheduleDateInput,
        apply,
        dry_run_token: apply ? lastResumeDryRun?.token : undefined,
      });
      if (!apply) {
        setLastResumeDryRun({
          agentCount,
          scheduleDate: scheduleDateInput,
          token: result.dry_run_token || "",
          availableAgentCount: Number(result.available_agent_count || 0),
          missingAgentCount: Number(result.missing_agent_count || 0),
          preview: result.preview || [],
        });
      } else {
        resetResumeDryRun();
      }
      setOperationMessage(
        apply
          ? `재가동 완료: 독자 ${numberFormat(result.reactivated_agent_count)}명 / 스케줄 ${numberFormat(result.schedule_count)}개`
          : `재가동 사전 확인: 가능 ${numberFormat(result.available_agent_count)}명 / 부족 ${numberFormat(result.missing_agent_count)}명`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "일시중지 독자 재가동에 실패했습니다.");
    }
  };

  const summary = data?.summary;
  const isProductFiltered = productId !== undefined;
  const llmSuccessRate = percentFormat(
    summary?.success_decision_count,
    summary?.decision_count
  );

  const productColumns: Column[] = [
    { header: "작품 ID", key: "product_id" },
    { header: "작품", key: "product_title" },
    {
      header: "조회 AI/공개누적",
      key: "view_ratio",
      render: (_value, row) =>
        `${numberFormat(row.ai_view_count)} / ${numberFormat(row.public_view_count)} (${percentFormat(row.ai_view_count, row.public_view_count)})`,
    },
    {
      header: "추천 AI/공개누적",
      key: "recommend_ratio",
      render: (_value, row) =>
        `${numberFormat(row.ai_recommend_count)} / ${numberFormat(row.public_recommend_count)} (${percentFormat(row.ai_recommend_count, row.public_recommend_count)})`,
    },
    {
      header: "선호 AI/공개누적",
      key: "bookmark_ratio",
      render: (_value, row) =>
        `${numberFormat(row.ai_bookmark_count)} / ${numberFormat(row.public_bookmark_count)} (${percentFormat(row.ai_bookmark_count, row.public_bookmark_count)})`,
    },
    {
      header: "평가 AI/공개누적",
      key: "evaluation_ratio",
      render: (_value, row) =>
        `${numberFormat(row.ai_evaluation_count)} / ${numberFormat(row.public_evaluation_count)} (${percentFormat(row.ai_evaluation_count, row.public_evaluation_count)})`,
    },
    { header: "드롭", key: "drop_count", render: numberFormat },
    { header: "AI 점수", key: "ai_popularity_score", render: numberFormat },
  ];

  const scopeKpis = [
    {
      label: "기간 AI 조회",
      value: summary?.ai_view_count,
      sub: `적용 action ${numberFormat(summary?.applied_action_count)}`,
    },
    {
      label: "기간 추천",
      value: summary?.ai_recommend_count,
      sub: `해제 ${numberFormat(summary?.ai_unrecommend_count)}`,
    },
    {
      label: "기간 선호작",
      value: summary?.ai_bookmark_count,
      sub: `해제 ${numberFormat(summary?.ai_unbookmark_count)}`,
    },
    {
      label: "기간 평가",
      value: summary?.ai_evaluation_count,
      sub: `드롭 ${numberFormat(summary?.drop_count)}`,
    },
    {
      label: "Worker 대기/실패",
      value: `${numberFormat(summary?.queued_action_count)} / ${numberFormat(summary?.failed_action_count)}`,
      sub: `실행 ${numberFormat(summary?.running_action_count)} / 적용 ${numberFormat(summary?.applied_action_count)}`,
    },
  ];

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="AI 유저 인게이지먼트" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* 검색 영역 */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
          <SearchByDateRange
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
          <Input
            className="w-[160px]"
            placeholder="작품 ID"
            value={productIdInput}
            onChange={(e) => setProductIdInput(e.target.value.replace(/\D/g, ""))}
          />
          <Button onClick={handleSearch}>검색</Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>

        {/* 운영 status 바 — 페이지 진입 시 가장 먼저 보이는 영역 */}
        <div className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">활성 AI</span>
                <span className="text-xl font-semibold tabular-nums">
                  {numberFormat(summary?.active_agent_count)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / 등록 {numberFormat(summary?.total_agent_count)}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">오늘 스케줄</span>
                <span className="text-xl font-semibold tabular-nums">
                  {numberFormat(summary?.today_schedule_count)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / 열린 {numberFormat(summary?.open_schedule_count)}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">실패 스케줄</span>
                <span
                  className={`text-xl font-semibold tabular-nums ${Number(summary?.failed_schedule_count || 0) > 0 ? "text-destructive" : ""}`}
                >
                  {numberFormat(summary?.failed_schedule_count)}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">LLM 성공률</span>
                <span className="text-xl font-semibold tabular-nums">{llmSuccessRate}</span>
                <span className="text-xs text-muted-foreground">
                  대기 {numberFormat(summary?.pending_decision_count)} / 실패{" "}
                  {numberFormat(summary?.failed_decision_count)}
                </span>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handlePauseAllAgents}
              disabled={pauseAllMutation.isPending}
              className="font-semibold"
            >
              <CirclePause className="mr-2 h-4 w-4" />
              전체 일시정지
            </Button>
          </div>
          {operationMessage && (
            <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs">
              {operationMessage}
            </div>
          )}
        </div>

        {/* 일시중지 독자 재가동 */}
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">일시중지 독자 재가동</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                paused 상태인 기존 AI 독자를 선택한 수만큼 active로 전환합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleResumePausedAgents(false)}
                disabled={resumePausedMutation.isPending}
              >
                사전 확인
              </Button>
              <Button
                onClick={() => handleResumePausedAgents(true)}
                disabled={resumePausedMutation.isPending || !hasMatchingResumeDryRun}
              >
                <Play className="mr-2 h-4 w-4" />
                재가동 적용
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              type="date"
              value={scheduleDateInput}
              onChange={(e) => {
                setScheduleDateInput(e.target.value);
                resetDryRun();
                resetResumeDryRun();
              }}
            />
            <Input
              inputMode="numeric"
              placeholder="재가동 수"
              value={resumeCount}
              onChange={(e) => {
                setResumeCount(e.target.value.replace(/\D/g, ""));
                resetResumeDryRun();
              }}
            />
          </div>
          {lastResumeDryRun && (
            <div className="mt-3 rounded-md border bg-muted/20 px-3 py-2 text-xs">
              <div className="font-medium">최근 재가동 사전 확인</div>
              <div className="mt-1 text-muted-foreground">
                가능 {numberFormat(lastResumeDryRun.availableAgentCount)}명 / 부족{" "}
                {numberFormat(lastResumeDryRun.missingAgentCount)}명 / 선택{" "}
                {numberFormat(lastResumeDryRun.preview.length)}명
              </div>
              {!hasMatchingResumeDryRun && (
                <div className="mt-1 text-destructive">
                  현재 입력과 재가동 사전 확인 결과가 다릅니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 시간대 활동 차트 */}
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">시간대 활동</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                지난 활동은 실 데이터, 예정 활동은 백엔드 API 추가 후 표시됩니다.
              </p>
            </div>
            <div className="inline-flex rounded-md border bg-muted/20 p-0.5">
              <button
                type="button"
                onClick={() => setHourlyTab("past")}
                className={`px-3 py-1 text-xs rounded-sm transition ${
                  hourlyTab === "past"
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                지난 활동
              </button>
              <button
                type="button"
                disabled
                title="백엔드 API 추가 후 활성화 예정"
                className="px-3 py-1 text-xs rounded-sm text-muted-foreground/60 cursor-not-allowed"
              >
                예정 활동
              </button>
            </div>
          </div>
          {hourlyTab === "past" && (
            <AiReaderHourlyBarChart data={data?.hourly_summary || []} height={260} />
          )}
        </div>

        {/* 신규 AI 독자 일괄 투입 */}
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">신규 AI 독자 일괄 투입</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              AI 전용 계정을 AI 독자로 등록하고, 선택한 날짜의 활동 스케줄을 생성합니다.
            </p>
          </div>

          {/* Step 1. 강도 + 프리셋 */}
          <div className="mb-5 rounded-md border bg-muted/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                1
              </span>
              <h3 className="text-xs font-medium">강도와 프리셋</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as AiReaderIntensity[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={intensity === item ? "default" : "outline"}
                  onClick={() => handleIntensityChange(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="mt-2 rounded-md border bg-white px-3 py-2 text-xs text-muted-foreground">
              예상 {numberFormat(estimatedDailySessions)}세션/일 · LLM 예산 최대{" "}
              {numberFormat(estimatedDailyLlmBudget)}회/일
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allPresets.map((preset) => (
                <div key={preset.id} className="relative">
                  <Button
                    type="button"
                    variant={selectedPresetId === preset.id ? "default" : "outline"}
                    className="h-auto min-h-10 w-full whitespace-normal px-2 py-2 text-xs"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                  {!preset.locked && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomPreset(preset)}
                      className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border bg-white text-muted-foreground hover:text-destructive"
                      title="프리셋 삭제"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 2. 투입 설정 */}
          <div className="mb-5 rounded-md border bg-muted/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                2
              </span>
              <h3 className="text-xs font-medium">투입 설정</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                placeholder="ai-reader-"
                value={bootstrapPrefix}
                onChange={(e) => {
                  setBootstrapPrefix(e.target.value);
                  resetDryRun();
                }}
              />
              <Input
                type="date"
                value={scheduleDateInput}
                onChange={(e) => {
                  setScheduleDateInput(e.target.value);
                  resetDryRun();
                  resetResumeDryRun();
                }}
              />
              <Input
                inputMode="numeric"
                placeholder="투입 수"
                value={bootstrapCount}
                onChange={(e) => {
                  setBootstrapCount(e.target.value.replace(/\D/g, ""));
                  resetDryRun();
                }}
              />
              <Input
                inputMode="numeric"
                placeholder="세션 목표"
                value={dailySessionTargetInput}
                onChange={(e) => {
                  setDailySessionTargetInput(e.target.value.replace(/\D/g, ""));
                  resetDryRun();
                }}
              />
              <Input
                inputMode="numeric"
                placeholder="LLM 예산"
                value={dailyLlmBudgetInput}
                onChange={(e) => {
                  setDailyLlmBudgetInput(e.target.value.replace(/\D/g, ""));
                  resetDryRun();
                }}
              />
              <Input
                placeholder="활동 시간 예: 6,7,12,20,21,22"
                value={activeHoursInput}
                onChange={(e) => {
                  setActiveHoursInput(e.target.value);
                  resetDryRun();
                }}
              />
            </div>
          </div>

          {/* 고급 설정 (접힘) */}
          <div className="mb-5 rounded-md border bg-muted/10">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="flex w-full items-center justify-between p-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                {advancedOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                고급 설정 — 연령/성별 비율, 프리셋 저장
              </span>
              <span className="text-[11px]">
                {advancedOpen ? "접기" : `연령 합계 ${ageGroupRatioTotal} · 성별 합계 ${genderRatioTotal}`}
              </span>
            </button>
            {advancedOpen && (
              <div className="space-y-4 border-t p-3">
                <div>
                  <h4 className="mb-2 text-[11px] font-medium text-muted-foreground">연령 비율</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {ageGroupKeys.map((key) => (
                      <label key={key} className="text-[11px] text-muted-foreground">
                        {ageGroupLabel[key]}
                        <Input
                          className="mt-1 px-2"
                          inputMode="numeric"
                          value={ageGroupRatios[key] ?? 0}
                          onChange={(e) =>
                            handleRatioChange(setAgeGroupRatios, ageGroupRatios, key, e.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div
                    className={`mt-1 text-xs ${ageGroupRatioTotal === 100 ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    합계 {ageGroupRatioTotal}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-[11px] font-medium text-muted-foreground">성별 비율</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {genderKeys.map((key) => (
                      <label key={key} className="text-xs text-muted-foreground">
                        {genderLabel[key]}
                        <Input
                          className="mt-1"
                          inputMode="numeric"
                          value={genderRatios[key] ?? 0}
                          onChange={(e) =>
                            handleRatioChange(setGenderRatios, genderRatios, key, e.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div
                    className={`mt-1 text-xs ${genderRatioTotal === 100 ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    합계 {genderRatioTotal}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-[11px] font-medium text-muted-foreground">
                    현재 설정으로 프리셋 저장
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="새 프리셋 이름"
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddPreset}>
                      프리셋 저장
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 사전 확인 + 적용 */}
          <div className="sticky bottom-0 -mx-4 mt-4 border-t bg-white px-4 pb-2 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                사전 확인 후 같은 입력으로만 투입 적용할 수 있습니다.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBootstrap(false)}
                  disabled={bootstrapMutation.isPending}
                >
                  1. 사전 확인
                </Button>
                <Button
                  onClick={() => handleBootstrap(true)}
                  disabled={bootstrapMutation.isPending || !hasMatchingDryRun}
                >
                  2. 투입 적용
                </Button>
              </div>
            </div>
            {lastDryRun && (
              <div className="mt-3 rounded-md border bg-muted/20 px-3 py-2 text-xs">
                <div className="font-medium">최근 사전 확인</div>
                <div className="mt-1 text-muted-foreground">
                  사용 가능 {numberFormat(lastDryRun.availableUserCount)}명 / 부족{" "}
                  {numberFormat(lastDryRun.missingUserCount)}명 / 예상 스케줄{" "}
                  {numberFormat(lastDryRunEstimatedScheduleCount)}개
                </div>
                {!hasMatchingDryRun && (
                  <div className="mt-1 text-destructive">
                    현재 입력과 사전 확인 결과가 다릅니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 기간 반응 KPI */}
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">선택 범위 반응</h2>
            <span className="text-xs text-muted-foreground">
              {isProductFiltered ? `작품 ${productId} 기준` : "전체 작품 기준"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {scopeKpis.map((item) => (
              <div key={item.label} className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold">
                  {typeof item.value === "string" ? item.value : numberFormat(item.value)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 작품별 AI 반응 */}
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">작품별 AI 반응</h2>
            <span className="text-sm text-muted-foreground">
              총 {numberFormat(data?.total_count)}개 작품
            </span>
          </div>
          <CommonTable
            columns={productColumns}
            data={data?.results || []}
            loading={isLoadingData || isFetching}
            emptyMessage="AI 반응 데이터가 없습니다."
          />
          <div className="mt-4">
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={calculatePageCount(data?.total_count || 0, item_per_page)}
            />
          </div>
        </div>

        {/* 개별 관리 페이지 진입 */}
        <Link
          href="/statistics/ai-reader/agents"
          className="flex items-center justify-between rounded-lg border bg-white p-4 transition hover:bg-muted/30"
        >
          <div>
            <h2 className="text-sm font-semibold">개별 AI 독자 관리</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              AI 독자 목록 / 개별 스케줄 조정 / 활동 분포·코호트·문제 로그
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <FullPageLoader isLoading={isLoadingData} />
      </div>
    </SidebarInset>
  );
}

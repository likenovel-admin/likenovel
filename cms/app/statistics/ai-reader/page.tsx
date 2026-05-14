"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, CirclePause, Play, RefreshCw, X } from "lucide-react";

import {
  useBootstrapAiReaderAgents,
  useGetAiReaderAgents,
  usePauseAllAiReaderAgents,
  useRefreshAiReaderSchedules,
  useResumePausedAiReaderAgents,
  useRestartAiReaderAgents,
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
import { formatAiReaderDisplayName } from "@/lib/ai-reader-display-name";
import { calculatePageCount, cn } from "@/lib/utils";
import {
  aiReaderActionToneClassName,
  formatAiReaderActionScoreLabel,
  formatAiReaderActionStatusLabel,
} from "./_lib";
import { getAiReaderTargetOperation } from "./target-operations";

const numberFormat = (value: unknown) => Number(value || 0).toLocaleString();

const signedNumberFormat = (value: unknown) => {
  const count = Number(value || 0);
  return count > 0 ? `+${count.toLocaleString()}` : count.toLocaleString();
};

const percentFormat = (part: unknown, total: unknown) => {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  if (!denominator) return "-";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

const formatRecentActionTime = (value?: string | null) => {
  if (!value) return "--:--:--";
  const normalized = String(value).replace("T", " ");
  // expect "YYYY-MM-DD HH:MM:SS..."
  const parts = normalized.split(" ");
  const datePart = parts[0] || "";
  const timePart = (parts[1] || "").slice(0, 8);
  const monthDay = datePart.length >= 10 ? datePart.slice(5, 10) : datePart;
  return `${monthDay} ${timePart}`.trim();
};

const formatRecentActionLabel = (actionType: string, targetValue: string | null | undefined) => {
  const type = String(actionType || "").toLowerCase();
  if (type === "recommend") return targetValue === "N" ? "추천을 해제했습니다" : "추천했습니다";
  if (type === "bookmark") return targetValue === "N" ? "선호작에서 제외했습니다" : "선호작에 추가했습니다";
  if (type === "read") return "회차를 조회했습니다";
  if (type === "evaluate") return "평가했습니다";
  if (type === "drop") return "감상을 중단(드롭)했습니다";
  return actionType || "활동";
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

const rangeHours = (startHour: number, endHourExclusive: number) =>
  Array.from({ length: Math.max(0, endHourExclusive - startHour) }, (_item, index) => startHour + index)
    .filter((hour) => hour >= 0 && hour <= 23);

const toHoursInput = (hours: number[]) => [...new Set(hours)]
  .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
  .sort((a, b) => a - b)
  .join(",");

const getRecommendedImmediateBatchSize = (agentCount: number) => {
  if (agentCount <= 20) return Math.max(1, agentCount || 1);
  if (agentCount <= 50) return 10;
  return 20;
};

const roundUpToNextFiveMinutes = (value: Date) => {
  const next = new Date(value);
  next.setSeconds(0, 0);
  const remainder = next.getMinutes() % 5;
  if (remainder === 0 && value.getSeconds() === 0 && value.getMilliseconds() === 0) {
    return next;
  }
  next.setMinutes(next.getMinutes() + (remainder === 0 ? 5 : 5 - remainder));
  return next;
};

const buildImmediateSchedulePreview = ({
  agentCount,
  scheduleDate,
  startImmediately,
  batchSize,
  batchIntervalMinutes,
}: {
  agentCount: number;
  scheduleDate: string;
  startImmediately: boolean;
  batchSize: number;
  batchIntervalMinutes: number;
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  if (!startImmediately || scheduleDate !== today || agentCount < 1) return [];
  const normalizedBatchSize = Math.max(1, Math.min(MAX_AI_READER_AGENT_COUNT, batchSize || 1));
  const normalizedInterval = Math.max(1, Math.min(120, batchIntervalMinutes || 10));
  const windowMinutes = Math.max(30, normalizedInterval);
  const firstStartAt = roundUpToNextFiveMinutes(new Date());
  const preview: Array<{ active_start_at: string; active_end_at: string; agent_count: number }> = [];
  let remainingCount = agentCount;
  let batchIndex = 0;
  while (remainingCount > 0) {
    const batchAgentCount = Math.min(normalizedBatchSize, remainingCount);
    const activeStartAt = new Date(firstStartAt);
    activeStartAt.setMinutes(firstStartAt.getMinutes() + batchIndex * normalizedInterval);
    const activeEndAt = new Date(activeStartAt);
    activeEndAt.setMinutes(activeStartAt.getMinutes() + windowMinutes);
    preview.push({
      active_start_at: format(activeStartAt, "yyyy-MM-dd HH:mm:ss"),
      active_end_at: format(activeEndAt, "yyyy-MM-dd HH:mm:ss"),
      agent_count: batchAgentCount,
    });
    remainingCount -= batchAgentCount;
    batchIndex += 1;
  }
  return preview;
};

const formatSchedulePreviewTime = (value: string) => {
  if (!value) return "--:--";
  const normalized = value.replace("T", " ");
  return normalized.slice(11, 16) || normalized;
};

const countImmediateScheduleRows = (
  preview?: Array<{ agent_count?: number | null }> | null
) => (preview || []).reduce((sum, item) => sum + Number(item.agent_count || 0), 0);

const getScheduleEndDateInput = (startDateInput: string, durationDays: number) => {
  const [year, month, day] = startDateInput.split("-").map(Number);
  if (!year || !month || !day) return startDateInput;
  const endDate = new Date(year, month - 1, day);
  endDate.setDate(endDate.getDate() + Math.max(1, durationDays) - 1);
  return format(endDate, "yyyy-MM-dd");
};

const MAX_AI_READER_AGENT_COUNT = 100;
const AI_READER_EFFECTS_PER_PAGE = 20;
const AI_READER_PRESET_STORAGE_KEY = "likenovel.cms.aiReader.customPresets.v1";
const AI_READER_DURATION_OPTIONS = [
  { days: 1, label: "오늘만" },
  { days: 3, label: "3일" },
  { days: 7, label: "7일" },
  { days: 14, label: "14일" },
  { days: 30, label: "30일" },
  { days: 90, label: "90일" },
];

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
  scheduleDurationDays: number;
  scheduleEndDate: string;
  dailyLlmBudget: number;
  activeHours: number[];
  dailySessionTarget: number;
  startImmediately: boolean;
  immediateBatchSize: number;
  immediateBatchIntervalMinutes: number;
  immediateScheduleStartAt: string | null;
  ageGroupRatios: RatioMap;
  genderRatios: RatioMap;
  token: string;
  availableUserCount: number;
  missingUserCount: number;
  immediateSchedulePreview: NonNullable<IAiReaderBootstrapResponse["immediate_schedule_preview"]>;
  preview: NonNullable<IAiReaderBootstrapResponse["preview"]>;
};

type LastResumeDryRun = {
  source: "resume" | "restart";
  agentCount: number;
  scheduleDate: string;
  scheduleDurationDays: number;
  scheduleEndDate: string;
  activeHours: number[];
  dailySessionTarget: number;
  dailyLlmBudget: number;
  startImmediately: boolean;
  immediateBatchSize: number;
  immediateBatchIntervalMinutes: number;
  immediateScheduleStartAt: string | null;
  token: string;
  availableAgentCount: number;
  missingAgentCount: number;
  immediateSchedulePreview: NonNullable<IAiReaderResumePausedResponse["immediate_schedule_preview"]>;
  preview: NonNullable<IAiReaderResumePausedResponse["preview"]>;
};

export default function Page() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [scheduleDateInput, setScheduleDateInput] = useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduleDurationDays, setScheduleDurationDays] = useState("1");
  const [bootstrapPrefix, setBootstrapPrefix] = useState("ai-reader-");
  const [bootstrapCount, setBootstrapCount] = useState("100");
  const [resumeCount, setResumeCount] = useState("100");
  const [targetActiveCount, setTargetActiveCount] = useState("100");
  const [selectedPresetId, setSelectedPresetId] = useState("default-medium");
  const [customPresets, setCustomPresets] = useState<AiReaderPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [intensity, setIntensity] = useState<AiReaderIntensity>("MEDIUM");
  const [activeHoursInput, setActiveHoursInput] = useState("6,7,12,20,21,22");
  const [dailySessionTargetInput, setDailySessionTargetInput] = useState("2");
  const [dailyLlmBudgetInput, setDailyLlmBudgetInput] = useState("8");
  const [startImmediately, setStartImmediately] = useState(true);
  const [immediateBatchSizeMode, setImmediateBatchSizeMode] = useState("auto");
  const [immediateBatchSizeInput, setImmediateBatchSizeInput] = useState("20");
  const [immediateBatchIntervalInput, setImmediateBatchIntervalInput] = useState("10");
  const [ageGroupRatios, setAgeGroupRatios] = useState<RatioMap>(defaultAgeGroupRatios);
  const [genderRatios, setGenderRatios] = useState<RatioMap>(defaultGenderRatios);
  const [lastDryRun, setLastDryRun] = useState<LastDryRun | null>(null);
  const [lastResumeDryRun, setLastResumeDryRun] = useState<LastResumeDryRun | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [agentSetupOpen, setAgentSetupOpen] = useState(false);
  const [hourlyTab, setHourlyTab] = useState<"past" | "upcoming">("past");

  useEffect(() => {
    setCustomPresets(readCustomPresets());
  }, []);

  const queryParams = useMemo<IGetStatisticAiReaderEngagementParams>(
    () => ({
      page,
      count_per_page: AI_READER_EFFECTS_PER_PAGE,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    }),
    [page, startDate, endDate]
  );
  const actionTimelineHref = useMemo(() => {
    const params = new URLSearchParams();
    if (queryParams.start_date) params.set("start_date", queryParams.start_date);
    if (queryParams.end_date) params.set("end_date", queryParams.end_date);
    const queryString = params.toString();
    return `/statistics/ai-reader/actions${queryString ? `?${queryString}` : ""}`;
  }, [queryParams.start_date, queryParams.end_date]);

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
  const refreshSchedulesMutation = useRefreshAiReaderSchedules();
  const restartMutation = useRestartAiReaderAgents();

  const bootstrapCountValue = Number(bootstrapCount || 0);
  const resumeCountValue = Number(resumeCount || 0);
  const scheduleDurationDaysValue = Number(scheduleDurationDays || 0);
  const normalizedScheduleDurationDays = Math.max(1, scheduleDurationDaysValue || 1);
  const scheduleEndDateInput = getScheduleEndDateInput(scheduleDateInput, normalizedScheduleDurationDays);
  const dailyLlmBudgetValue = Number(dailyLlmBudgetInput || 8);
  const dailySessionTargetValue = Number(dailySessionTargetInput || 1);
  const immediateBatchSizeValue = immediateBatchSizeMode === "auto"
    ? getRecommendedImmediateBatchSize(bootstrapCountValue)
    : Number(immediateBatchSizeInput || 0);
  const resumeImmediateBatchSizeValue = immediateBatchSizeMode === "auto"
    ? getRecommendedImmediateBatchSize(resumeCountValue)
    : Number(immediateBatchSizeInput || 0);
  const immediateBatchIntervalValue = Number(immediateBatchIntervalInput || 10);
  const todayDateInput = format(new Date(), "yyyy-MM-dd");
  const isImmediateScheduleDate = scheduleDateInput === todayDateInput;
  const allPresets = useMemo(() => [...defaultPresets, ...customPresets], [customPresets]);
  const activeHoursValue = useMemo(() => {
    try {
      return parseHoursInput(activeHoursInput);
    } catch {
      return [];
    }
  }, [activeHoursInput]);
  const selectedPreset = useMemo(
    () => allPresets.find((preset) => preset.id === selectedPresetId),
    [allPresets, selectedPresetId]
  );
  const activeHoursCompactLabel = activeHoursValue.length
    ? activeHoursValue.length > 8
      ? `${activeHoursValue.slice(0, 8).join(", ")} 외 ${activeHoursValue.length - 8}개`
      : activeHoursValue.join(", ")
    : "-";
  const activitySettingSummary = `${selectedPreset?.name ?? "사용자 설정"} · ${intensity} · ${numberFormat(
    dailySessionTargetValue
  )}회/일 · LLM ${numberFormat(dailyLlmBudgetValue)}회/일`;
  const scheduleSettingSummary = `${numberFormat(normalizedScheduleDurationDays)}일 · ${
    startImmediately && isImmediateScheduleDate
      ? `바로 시작 ${numberFormat(immediateBatchSizeValue)}명씩`
      : "예약 시간부터 시작"
  } · 활동시간 ${activeHoursCompactLabel}`;
  const ageGroupRatioTotal = sumRatios(ageGroupRatios);
  const genderRatioTotal = sumRatios(genderRatios);
  const estimatedDailySessions = bootstrapCountValue * dailySessionTargetValue;
  const estimatedPeriodSessions = estimatedDailySessions * normalizedScheduleDurationDays;
  const estimatedDailyLlmBudget = bootstrapCountValue * dailyLlmBudgetValue;
  const estimatedImmediateSchedulePreview = useMemo(
    () => buildImmediateSchedulePreview({
      agentCount: bootstrapCountValue,
      scheduleDate: scheduleDateInput,
      startImmediately,
      batchSize: immediateBatchSizeValue,
      batchIntervalMinutes: immediateBatchIntervalValue,
    }),
    [
      bootstrapCountValue,
      scheduleDateInput,
      startImmediately,
      immediateBatchSizeValue,
      immediateBatchIntervalValue,
    ]
  );
  const lastDryRunRepeatingScheduleCount = lastDryRun
    ? lastDryRun.availableUserCount * lastDryRun.dailySessionTarget * lastDryRun.scheduleDurationDays
    : 0;
  const lastDryRunImmediateScheduleCount = lastDryRun
    ? countImmediateScheduleRows(lastDryRun.immediateSchedulePreview)
    : 0;
  const lastDryRunEstimatedScheduleCount =
    lastDryRunRepeatingScheduleCount + lastDryRunImmediateScheduleCount;
  const visibleImmediateSchedulePreview = lastDryRun
    && lastDryRun.agentCount === bootstrapCountValue
    && lastDryRun.scheduleDate === scheduleDateInput
    && lastDryRun.scheduleDurationDays === scheduleDurationDaysValue
    && lastDryRun.startImmediately === startImmediately
    && lastDryRun.immediateBatchSize === immediateBatchSizeValue
    && lastDryRun.immediateBatchIntervalMinutes === immediateBatchIntervalValue
    && lastDryRun.immediateSchedulePreview.length
    ? lastDryRun.immediateSchedulePreview
    : estimatedImmediateSchedulePreview;
  const hasSameBootstrapDryRunInput = Boolean(
    lastDryRun
      && lastDryRun.emailPrefix === bootstrapPrefix
      && lastDryRun.agentCount === bootstrapCountValue
      && lastDryRun.scheduleDate === scheduleDateInput
      && lastDryRun.scheduleDurationDays === scheduleDurationDaysValue
      && lastDryRun.dailyLlmBudget === dailyLlmBudgetValue
      && lastDryRun.dailySessionTarget === dailySessionTargetValue
      && lastDryRun.startImmediately === startImmediately
      && lastDryRun.immediateBatchSize === immediateBatchSizeValue
      && lastDryRun.immediateBatchIntervalMinutes === immediateBatchIntervalValue
      && JSON.stringify(lastDryRun.activeHours) === JSON.stringify(activeHoursValue)
      && JSON.stringify(lastDryRun.ageGroupRatios) === JSON.stringify(ageGroupRatios)
      && JSON.stringify(lastDryRun.genderRatios) === JSON.stringify(genderRatios)
  );
  const hasMatchingDryRun = Boolean(
    hasSameBootstrapDryRunInput
      && lastDryRun?.token
      && lastDryRun.missingUserCount === 0
  );
  const bootstrapDryRunBlockMessage = lastDryRun && !hasMatchingDryRun
    ? lastDryRun.missingUserCount > 0
      ? `AI 전용 ready 계정이 ${numberFormat(lastDryRun.missingUserCount)}명 부족합니다. 이메일 prefix 또는 투입 수를 조정하거나, 먼저 전용 계정을 발급하세요.`
      : !hasSameBootstrapDryRunInput
        ? "현재 입력과 사전 확인 결과가 다릅니다."
        : "사전 확인 토큰이 없습니다. 사전 확인을 다시 눌러주세요."
    : null;
  const hasMatchingResumeDryRun = Boolean(
    lastResumeDryRun
      && lastResumeDryRun.source === "resume"
      && lastResumeDryRun.agentCount === resumeCountValue
      && lastResumeDryRun.scheduleDate === scheduleDateInput
      && lastResumeDryRun.scheduleDurationDays === scheduleDurationDaysValue
      && JSON.stringify(lastResumeDryRun.activeHours) === JSON.stringify(activeHoursValue)
      && lastResumeDryRun.dailySessionTarget === dailySessionTargetValue
      && lastResumeDryRun.dailyLlmBudget === dailyLlmBudgetValue
      && lastResumeDryRun.startImmediately === startImmediately
      && lastResumeDryRun.immediateBatchSize === resumeImmediateBatchSizeValue
      && lastResumeDryRun.immediateBatchIntervalMinutes === immediateBatchIntervalValue
      && lastResumeDryRun.token
      && lastResumeDryRun.missingAgentCount === 0
  );
  const isRestartDryRun = lastResumeDryRun?.source === "restart";
  const showResumeDryRunMismatch = lastResumeDryRun?.source === "resume" && !hasMatchingResumeDryRun;

  const handleSearch = () => {
    setPage(1);
  };

  const resetDryRun = () => setLastDryRun(null);
  const resetResumeDryRun = () => setLastResumeDryRun(null);

  const applyStartMode = (enabled: boolean) => {
    setStartImmediately(enabled);
    if (enabled) {
      setScheduleDateInput(todayDateInput);
    }
    resetDryRun();
    resetResumeDryRun();
  };

  const applyScheduleDuration = (days: number) => {
    setScheduleDurationDays(String(days));
    resetDryRun();
    resetResumeDryRun();
  };

  const applyActiveHours = (hours: number[]) => {
    setActiveHoursInput(toHoursInput(hours));
    resetDryRun();
  };

  const toggleActiveHour = (hour: number) => {
    const activeSet = new Set(activeHoursValue);
    if (activeSet.has(hour)) {
      activeSet.delete(hour);
    } else {
      activeSet.add(hour);
    }
    const nextHours = [...activeSet].sort((a, b) => a - b);
    if (!nextHours.length) {
      setOperationMessage("활동 시간은 최소 1개 이상 선택해야 합니다.");
      return;
    }
    setOperationMessage(null);
    applyActiveHours(nextHours);
  };

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
      if (scheduleDurationDaysValue < 1 || scheduleDurationDaysValue > 90) {
        setOperationMessage("스케줄 기간은 1~90일 사이로 입력하세요.");
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
      if (immediateBatchSizeValue < 1 || immediateBatchSizeValue > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`즉시 시작 배치 수는 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
        return;
      }
      if (immediateBatchIntervalValue < 1 || immediateBatchIntervalValue > 120) {
        setOperationMessage("즉시 시작 배치 간격은 1~120분 사이로 입력하세요.");
        return;
      }
      if (ageGroupRatioTotal !== 100 || genderRatioTotal !== 100) {
        setOperationMessage("연령/성별 비율 합계는 각각 100이어야 합니다.");
        return;
      }
      if (apply && !hasMatchingDryRun) {
        setOperationMessage(
          bootstrapDryRunBlockMessage
            || "같은 prefix/투입 수/날짜/기간/활동량/비율/LLM 예산으로 사전 확인을 먼저 통과해야 적용할 수 있습니다."
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
        schedule_duration_days: scheduleDurationDaysValue,
        apply,
        daily_llm_budget: dailyLlmBudgetValue,
        active_hours: activeHours,
        daily_session_target: dailySessionTargetValue,
        start_immediately: startImmediately,
        immediate_batch_size: immediateBatchSizeValue,
        immediate_batch_interval_minutes: immediateBatchIntervalValue,
        immediate_schedule_start_at: apply ? lastDryRun?.immediateScheduleStartAt || undefined : undefined,
        age_group_ratios: ageGroupRatios,
        gender_ratios: genderRatios,
        dry_run_token: apply ? lastDryRun?.token : undefined,
      });
      const immediateScheduleRows = countImmediateScheduleRows(result.immediate_schedule_preview);
      if (!apply) {
        setLastDryRun({
          emailPrefix: bootstrapPrefix,
          agentCount,
          scheduleDate: scheduleDateInput,
          scheduleDurationDays: Number(result.schedule_duration_days || scheduleDurationDaysValue),
          scheduleEndDate: result.schedule_end_date || scheduleEndDateInput,
          dailyLlmBudget: dailyLlmBudgetValue,
          activeHours,
          dailySessionTarget: dailySessionTargetValue,
          startImmediately,
          immediateBatchSize: immediateBatchSizeValue,
          immediateBatchIntervalMinutes: immediateBatchIntervalValue,
          immediateScheduleStartAt: result.immediate_schedule_start_at || null,
          ageGroupRatios: { ...ageGroupRatios },
          genderRatios: { ...genderRatios },
          token: result.dry_run_token || "",
          availableUserCount: Number(result.available_user_count || 0),
          missingUserCount: Number(result.missing_user_count || 0),
          immediateSchedulePreview: result.immediate_schedule_preview || [],
          preview: result.preview || [],
        });
      }
      setOperationMessage(
        apply
          ? `투입 완료: ${numberFormat(result.applied_count)}명 / ${scheduleDateInput}~${result.schedule_end_date || scheduleEndDateInput} 스케줄 ${numberFormat(result.schedule_count)}개`
          : `사전 확인: 사용 가능 ${numberFormat(result.available_user_count)}명 / 부족 ${numberFormat(result.missing_user_count)}명 / 기간 ${scheduleDateInput}~${result.schedule_end_date || scheduleEndDateInput} / 오늘 즉시 ${numberFormat(immediateScheduleRows)}명`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "투입 처리에 실패했습니다.");
    }
  };

  const handlePauseAllAgents = async () => {
    if (
      !window.confirm(
        "활동 중인 AI 독자를 모두 일시정지하고 남은 스케줄/action 대기열을 정리합니다. 계정과 과거 로그, 이미 반영된 지표는 삭제하지 않습니다. 진행할까요?"
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

  const runResumePausedAgentOperation = async (
    agentCount: number,
    successPrefix: string,
    skipConfirm = false
  ) => {
    const activeHours = parseHoursInput(activeHoursInput);
    const immediateBatchSize = immediateBatchSizeMode === "auto"
      ? getRecommendedImmediateBatchSize(agentCount)
      : Number(immediateBatchSizeInput || 0);

    if (agentCount < 1 || agentCount > MAX_AI_READER_AGENT_COUNT) {
      setOperationMessage(`투입 수는 1~${MAX_AI_READER_AGENT_COUNT}명까지 가능합니다.`);
      return false;
    }
    if (scheduleDurationDaysValue < 1 || scheduleDurationDaysValue > 90) {
      setOperationMessage("스케줄 기간은 1~90일 사이로 입력하세요.");
      return false;
    }
    if (immediateBatchSize < 1 || immediateBatchSize > MAX_AI_READER_AGENT_COUNT) {
      setOperationMessage(`즉시 시작 배치 수는 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
      return false;
    }
    if (immediateBatchIntervalValue < 1 || immediateBatchIntervalValue > 120) {
      setOperationMessage("즉시 시작 배치 간격은 1~120분 사이로 입력하세요.");
      return false;
    }

    const dryRunResult = await resumePausedMutation.mutateAsync({
      agent_count: agentCount,
      schedule_date: scheduleDateInput,
      schedule_duration_days: scheduleDurationDaysValue,
      apply: false,
      start_immediately: startImmediately,
      immediate_batch_size: immediateBatchSize,
      immediate_batch_interval_minutes: immediateBatchIntervalValue,
      active_hours: activeHours,
      daily_session_target: dailySessionTargetValue,
      daily_llm_budget: dailyLlmBudgetValue,
    });
    const immediateScheduleRows = countImmediateScheduleRows(dryRunResult.immediate_schedule_preview);
    setLastResumeDryRun({
      source: "resume",
      agentCount,
      scheduleDate: scheduleDateInput,
      scheduleDurationDays: Number(dryRunResult.schedule_duration_days || scheduleDurationDaysValue),
      scheduleEndDate: dryRunResult.schedule_end_date || scheduleEndDateInput,
      activeHours,
      dailySessionTarget: dailySessionTargetValue,
      dailyLlmBudget: dailyLlmBudgetValue,
      startImmediately,
      immediateBatchSize,
      immediateBatchIntervalMinutes: immediateBatchIntervalValue,
      immediateScheduleStartAt: dryRunResult.immediate_schedule_start_at || null,
      token: dryRunResult.dry_run_token || "",
      availableAgentCount: Number(dryRunResult.available_agent_count || 0),
      missingAgentCount: Number(dryRunResult.missing_agent_count || 0),
      immediateSchedulePreview: dryRunResult.immediate_schedule_preview || [],
      preview: dryRunResult.preview || [],
    });

    if (Number(dryRunResult.missing_agent_count || 0) > 0) {
      setOperationMessage(
        `추가 투입 가능한 대기 AI가 ${numberFormat(dryRunResult.missing_agent_count)}명 부족합니다. 아래 신규 AI 독자 생성에서 먼저 보충하세요.`
      );
      setAgentSetupOpen(true);
      setBootstrapCount(String(dryRunResult.missing_agent_count || agentCount));
      return false;
    }

    if (
      !skipConfirm
        && !window.confirm(
          `${agentCount.toLocaleString()}명을 활동 상태로 전환하고 ${scheduleDateInput}~${dryRunResult.schedule_end_date || scheduleEndDateInput} 스케줄을 생성합니다. 오늘 즉시 ${immediateScheduleRows.toLocaleString()}명이 시작됩니다. 진행할까요?`
        )
    ) {
      setOperationMessage(
        `사전 확인 완료: 가능 ${numberFormat(dryRunResult.available_agent_count)}명 / 기간 ${scheduleDateInput}~${dryRunResult.schedule_end_date || scheduleEndDateInput} / 오늘 즉시 ${numberFormat(immediateScheduleRows)}명`
      );
      return false;
    }

    const applyResult = await resumePausedMutation.mutateAsync({
      agent_count: agentCount,
      schedule_date: scheduleDateInput,
      schedule_duration_days: scheduleDurationDaysValue,
      apply: true,
      start_immediately: startImmediately,
      immediate_batch_size: immediateBatchSize,
      immediate_batch_interval_minutes: immediateBatchIntervalValue,
      immediate_schedule_start_at: dryRunResult.immediate_schedule_start_at || undefined,
      active_hours: activeHours,
      daily_session_target: dailySessionTargetValue,
      daily_llm_budget: dailyLlmBudgetValue,
      dry_run_token: dryRunResult.dry_run_token,
    });
    resetResumeDryRun();
    setOperationMessage(
      `${successPrefix}: 독자 ${numberFormat(applyResult.reactivated_agent_count)}명 / ${scheduleDateInput}~${applyResult.schedule_end_date || scheduleEndDateInput} 스케줄 ${numberFormat(applyResult.schedule_count)}개`
    );
    await refreshAiReaderState();
    return true;
  };

  const runRefreshActiveSchedulesOperation = async (agentCount: number) => {
    const activeHours = parseHoursInput(activeHoursInput);
    const immediateBatchSize = immediateBatchSizeMode === "auto"
      ? getRecommendedImmediateBatchSize(agentCount)
      : Number(immediateBatchSizeInput || 0);

    if (agentCount < 1 || agentCount > MAX_AI_READER_AGENT_COUNT) {
      setOperationMessage(`투입 수는 1~${MAX_AI_READER_AGENT_COUNT}명까지 가능합니다.`);
      return false;
    }
    if (scheduleDurationDaysValue < 1 || scheduleDurationDaysValue > 90) {
      setOperationMessage("스케줄 기간은 1~90일 사이로 입력하세요.");
      return false;
    }
    if (immediateBatchSize < 1 || immediateBatchSize > MAX_AI_READER_AGENT_COUNT) {
      setOperationMessage(`즉시 시작 배치 수는 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
      return false;
    }
    if (immediateBatchIntervalValue < 1 || immediateBatchIntervalValue > 120) {
      setOperationMessage("즉시 시작 배치 간격은 1~120분 사이로 입력하세요.");
      return false;
    }

    const dryRunResult = await refreshSchedulesMutation.mutateAsync({
      agent_count: agentCount,
      schedule_date: scheduleDateInput,
      schedule_duration_days: scheduleDurationDaysValue,
      apply: false,
      start_immediately: startImmediately,
      immediate_batch_size: immediateBatchSize,
      immediate_batch_interval_minutes: immediateBatchIntervalValue,
      active_hours: activeHours,
      daily_session_target: dailySessionTargetValue,
      daily_llm_budget: dailyLlmBudgetValue,
    });
    const immediateScheduleRows = countImmediateScheduleRows(dryRunResult.immediate_schedule_preview);

    if (Number(dryRunResult.missing_agent_count || 0) > 0) {
      setOperationMessage(
        `스케줄 없는 활성 AI가 ${numberFormat(dryRunResult.missing_agent_count)}명 부족합니다. 현재 가능한 ${numberFormat(dryRunResult.available_agent_count)}명까지만 다시 시작할 수 있습니다.`
      );
      return false;
    }

    if (
      !window.confirm(
        `스케줄 없는 활성 AI ${agentCount.toLocaleString()}명을 ${scheduleDateInput}~${dryRunResult.schedule_end_date || scheduleEndDateInput} 설정으로 다시 시작합니다. 오늘 즉시 ${immediateScheduleRows.toLocaleString()}명이 시작됩니다. 진행할까요?`
      )
    ) {
      setOperationMessage(
        `사전 확인 완료: 가능 ${numberFormat(dryRunResult.available_agent_count)}명 / 기간 ${scheduleDateInput}~${dryRunResult.schedule_end_date || scheduleEndDateInput} / 오늘 즉시 ${numberFormat(immediateScheduleRows)}명`
      );
      return false;
    }

    const applyResult = await refreshSchedulesMutation.mutateAsync({
      agent_count: agentCount,
      schedule_date: scheduleDateInput,
      schedule_duration_days: scheduleDurationDaysValue,
      apply: true,
      start_immediately: startImmediately,
      immediate_batch_size: immediateBatchSize,
      immediate_batch_interval_minutes: immediateBatchIntervalValue,
      immediate_schedule_start_at: dryRunResult.immediate_schedule_start_at || undefined,
      active_hours: activeHours,
      daily_session_target: dailySessionTargetValue,
      daily_llm_budget: dailyLlmBudgetValue,
      dry_run_token: dryRunResult.dry_run_token,
    });
    setOperationMessage(
      `운영 다시 시작 완료: 독자 ${numberFormat(applyResult.refreshed_agent_count)}명 / ${scheduleDateInput}~${applyResult.schedule_end_date || scheduleEndDateInput} 스케줄 ${numberFormat(applyResult.schedule_count)}개`
    );
    await refreshAiReaderState();
    return true;
  };

  const handleRefreshIdleActiveSchedules = async () => {
    try {
      setOperationMessage(null);
      if (refreshableIdleActiveAgentCount < 1) {
        setOperationMessage(
          idleActiveAgentCount > 0
            ? "스케줄 없는 활성 AI는 있지만 운영 다시 시작 가능한 계정이 없습니다. 계정 상태, 도메인, SNS 여부를 확인하세요."
            : "스케줄 없는 활성 AI가 없습니다."
        );
        return;
      }
      await runRefreshActiveSchedulesOperation(refreshableIdleActiveAgentCount);
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "운영 다시 시작에 실패했습니다.");
    }
  };

  const handleApplyTargetActiveCount = async () => {
    try {
      setOperationMessage(null);
      const currentActiveCount = Number(data?.summary?.active_agent_count || 0);
      const currentTotalCount = Number(data?.summary?.total_agent_count || 0);
      const currentAvailablePausedCount = Number(
        data?.summary?.available_paused_agent_count ?? Math.max(0, currentTotalCount - currentActiveCount)
      );
      const operation = getAiReaderTargetOperation({
        activeCount: currentActiveCount,
        totalCount: currentTotalCount,
        availablePausedCount: currentAvailablePausedCount,
        targetCount: Number(targetActiveCount || 0),
      });

      if (operation.kind === "invalid" || operation.kind === "no_change") {
        return;
      }
      if (operation.kind === "pause_all") {
        await handlePauseAllAgents();
        return;
      }
      if (operation.kind === "partial_decrease_unsupported") {
        setOperationMessage(operation.message);
        return;
      }
      if (operation.kind === "needs_more_agents") {
        setOperationMessage(`${operation.message} 부족분 ${numberFormat(operation.missingCount)}명을 먼저 생성하세요.`);
        setBootstrapCount(String(operation.missingCount));
        setAgentSetupOpen(true);
        return;
      }

      setResumeCount(String(operation.deltaCount));
      await runResumePausedAgentOperation(
        operation.deltaCount,
        `활성 ${numberFormat(operation.targetCount)}명 맞추기 완료`
      );
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "인원 맞추기에 실패했습니다.");
    }
  };

  const handleCleanRestart = async () => {
    try {
      setOperationMessage(null);
      const targetCount = Number(targetActiveCount || 0);
      const activeHours = parseHoursInput(activeHoursInput);
      const immediateBatchSize = immediateBatchSizeMode === "auto"
        ? getRecommendedImmediateBatchSize(targetCount)
        : Number(immediateBatchSizeInput || 0);
      if (!Number.isInteger(targetCount) || targetCount < 0 || targetCount > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`목표 인원은 0~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
        return;
      }
      if (targetCount === 0) {
        await handlePauseAllAgents();
        return;
      }
      if (scheduleDurationDaysValue < 1 || scheduleDurationDaysValue > 90) {
        setOperationMessage("스케줄 기간은 1~90일 사이로 입력하세요.");
        return;
      }
      if (immediateBatchSize < 1 || immediateBatchSize > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`즉시 시작 배치 수는 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
        return;
      }
      if (immediateBatchIntervalValue < 1 || immediateBatchIntervalValue > 120) {
        setOperationMessage("즉시 시작 배치 간격은 1~120분 사이로 입력하세요.");
        return;
      }

      const dryRunResult = await restartMutation.mutateAsync({
        agent_count: targetCount,
        schedule_date: scheduleDateInput,
        schedule_duration_days: scheduleDurationDaysValue,
        apply: false,
        start_immediately: startImmediately,
        immediate_batch_size: immediateBatchSize,
        immediate_batch_interval_minutes: immediateBatchIntervalValue,
        active_hours: activeHours,
        daily_session_target: dailySessionTargetValue,
        daily_llm_budget: dailyLlmBudgetValue,
      });
      const immediateScheduleRows = countImmediateScheduleRows(dryRunResult.immediate_schedule_preview);
      setLastResumeDryRun({
        source: "restart",
        agentCount: targetCount,
        scheduleDate: scheduleDateInput,
        scheduleDurationDays: Number(dryRunResult.schedule_duration_days || scheduleDurationDaysValue),
        scheduleEndDate: dryRunResult.schedule_end_date || scheduleEndDateInput,
        activeHours,
        dailySessionTarget: dailySessionTargetValue,
        dailyLlmBudget: dailyLlmBudgetValue,
        startImmediately,
        immediateBatchSize,
        immediateBatchIntervalMinutes: immediateBatchIntervalValue,
        immediateScheduleStartAt: dryRunResult.immediate_schedule_start_at || null,
        token: dryRunResult.dry_run_token || "",
        availableAgentCount: Number(dryRunResult.available_agent_count || 0),
        missingAgentCount: Number(dryRunResult.missing_agent_count || 0),
        immediateSchedulePreview: dryRunResult.immediate_schedule_preview || [],
        preview: dryRunResult.preview || [],
      });

      if (Number(dryRunResult.missing_agent_count || 0) > 0) {
        setOperationMessage(
          `예약 교체는 실행하지 않았습니다. 시작 가능한 AI가 ${numberFormat(dryRunResult.missing_agent_count)}명 부족합니다.`
        );
        setAgentSetupOpen(true);
        setBootstrapCount(String(dryRunResult.missing_agent_count || targetCount));
        return;
      }
      if (
        !window.confirm(
          `시작 가능 여부를 확인했습니다. 현재 AI 독자의 남은 예약과 대기 액션을 새 설정으로 교체한 뒤 ${targetCount.toLocaleString()}명을 시작합니다. 오늘 즉시 ${immediateScheduleRows.toLocaleString()}명이 시작됩니다. 진행할까요?`
        )
      ) {
        setOperationMessage(
          `사전 확인 완료: 가능 ${numberFormat(dryRunResult.available_agent_count)}명 / 기간 ${scheduleDateInput}~${dryRunResult.schedule_end_date || scheduleEndDateInput} / 오늘 즉시 ${numberFormat(immediateScheduleRows)}명. 예약 교체는 실행하지 않았습니다.`
        );
        return;
      }
      const applyResult = await restartMutation.mutateAsync({
        agent_count: targetCount,
        schedule_date: scheduleDateInput,
        schedule_duration_days: scheduleDurationDaysValue,
        apply: true,
        start_immediately: startImmediately,
        immediate_batch_size: immediateBatchSize,
        immediate_batch_interval_minutes: immediateBatchIntervalValue,
        immediate_schedule_start_at: dryRunResult.immediate_schedule_start_at || undefined,
        active_hours: activeHours,
        daily_session_target: dailySessionTargetValue,
        daily_llm_budget: dailyLlmBudgetValue,
        dry_run_token: dryRunResult.dry_run_token,
      });
      resetResumeDryRun();
      setOperationMessage(
        `기존 예약 교체 후 시작 완료: 시작 ${numberFormat(applyResult.restarted_agent_count)}명 / 일시정지 ${numberFormat(applyResult.paused_agent_count)}명 / 스케줄 정리 ${numberFormat(applyResult.retired_schedule_count)}개 / 액션 정리 ${numberFormat(applyResult.cancelled_action_count)}개 / 새 스케줄 ${numberFormat(applyResult.schedule_count)}개`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(
        error instanceof Error
          ? `기존 예약 교체 후 시작에 실패했습니다. 변경은 적용되지 않았습니다: ${error.message}`
          : "기존 예약 교체 후 시작에 실패했습니다. 변경은 적용되지 않았습니다."
      );
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
      if (scheduleDurationDaysValue < 1 || scheduleDurationDaysValue > 90) {
        setOperationMessage("스케줄 기간은 1~90일 사이로 입력하세요.");
        return;
      }
      if (resumeImmediateBatchSizeValue < 1 || resumeImmediateBatchSizeValue > MAX_AI_READER_AGENT_COUNT) {
        setOperationMessage(`즉시 시작 배치 수는 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
        return;
      }
      if (immediateBatchIntervalValue < 1 || immediateBatchIntervalValue > 120) {
        setOperationMessage("즉시 시작 배치 간격은 1~120분 사이로 입력하세요.");
        return;
      }
      if (apply && !hasMatchingResumeDryRun) {
        setOperationMessage("같은 날짜/기간/재가동 수/시작 방식으로 사전 확인을 먼저 통과해야 적용할 수 있습니다.");
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
        schedule_duration_days: scheduleDurationDaysValue,
        apply,
        start_immediately: startImmediately,
        immediate_batch_size: resumeImmediateBatchSizeValue,
        immediate_batch_interval_minutes: immediateBatchIntervalValue,
        immediate_schedule_start_at: apply ? lastResumeDryRun?.immediateScheduleStartAt || undefined : undefined,
        active_hours: parseHoursInput(activeHoursInput),
        daily_session_target: dailySessionTargetValue,
        daily_llm_budget: dailyLlmBudgetValue,
        dry_run_token: apply ? lastResumeDryRun?.token : undefined,
      });
      const immediateScheduleRows = countImmediateScheduleRows(result.immediate_schedule_preview);
      if (!apply) {
        setLastResumeDryRun({
          source: "resume",
          agentCount,
          scheduleDate: scheduleDateInput,
          scheduleDurationDays: Number(result.schedule_duration_days || scheduleDurationDaysValue),
          scheduleEndDate: result.schedule_end_date || scheduleEndDateInput,
          activeHours: parseHoursInput(activeHoursInput),
          dailySessionTarget: dailySessionTargetValue,
          dailyLlmBudget: dailyLlmBudgetValue,
          startImmediately,
          immediateBatchSize: resumeImmediateBatchSizeValue,
          immediateBatchIntervalMinutes: immediateBatchIntervalValue,
          immediateScheduleStartAt: result.immediate_schedule_start_at || null,
          token: result.dry_run_token || "",
          availableAgentCount: Number(result.available_agent_count || 0),
          missingAgentCount: Number(result.missing_agent_count || 0),
          immediateSchedulePreview: result.immediate_schedule_preview || [],
          preview: result.preview || [],
        });
      } else {
        resetResumeDryRun();
      }
      setOperationMessage(
        apply
          ? `재가동 완료: 독자 ${numberFormat(result.reactivated_agent_count)}명 / ${scheduleDateInput}~${result.schedule_end_date || scheduleEndDateInput} 스케줄 ${numberFormat(result.schedule_count)}개`
          : `재가동 사전 확인: 가능 ${numberFormat(result.available_agent_count)}명 / 부족 ${numberFormat(result.missing_agent_count)}명 / 기간 ${scheduleDateInput}~${result.schedule_end_date || scheduleEndDateInput} / 오늘 즉시 ${numberFormat(immediateScheduleRows)}명`
      );
      await refreshAiReaderState();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "일시중지 독자 재가동에 실패했습니다.");
    }
  };

  const summary = data?.summary;
  const activeAgentCount = Number(summary?.active_agent_count || 0);
  const totalAgentCount = Number(summary?.total_agent_count || 0);
  const scheduledActiveAgentCount = Number(summary?.scheduled_active_agent_count || 0);
  const idleActiveAgentCount = Number(
    summary?.idle_active_agent_count ?? Math.max(0, activeAgentCount - scheduledActiveAgentCount)
  );
  const refreshableIdleActiveAgentCount = Number(
    summary?.available_idle_active_agent_count ?? idleActiveAgentCount
  );
  const excludedIdleActiveAgentCount = Math.max(0, idleActiveAgentCount - refreshableIdleActiveAgentCount);
  const pausedAgentCount = Number(
    summary?.paused_agent_count ?? Math.max(0, totalAgentCount - activeAgentCount)
  );
  const availablePausedAgentCount = Number(
    summary?.available_paused_agent_count ?? pausedAgentCount
  );
  const targetActiveCountValue = Number(targetActiveCount || 0);
  const targetOperation = getAiReaderTargetOperation({
    activeCount: activeAgentCount,
    totalCount: totalAgentCount,
    availablePausedCount: availablePausedAgentCount,
    targetCount: targetActiveCountValue,
  });
  const targetOperationMessage = targetOperation.kind === "no_change" && idleActiveAgentCount > 0
    ? refreshableIdleActiveAgentCount > 0
      ? "활성 인원은 이미 맞지만 스케줄 없는 활성 AI가 있습니다. 다음 작업에서 운영을 다시 시작하세요."
      : "활성 인원은 이미 맞지만 스케줄 없는 활성 AI 중 운영 다시 시작 가능한 계정이 없습니다."
    : targetOperation.message;
  const pendingOperation = bootstrapMutation.isPending || pauseAllMutation.isPending || resumePausedMutation.isPending || refreshSchedulesMutation.isPending || restartMutation.isPending;
  const canRefreshIdleActiveSchedules = refreshableIdleActiveAgentCount > 0;
  const plannedRunDurationLabel = `${numberFormat(normalizedScheduleDurationDays)}일`;
  const nextRunMode = (() => {
    if (!Number.isInteger(targetActiveCountValue) || targetActiveCountValue < 1 || targetActiveCountValue > MAX_AI_READER_AGENT_COUNT) {
      return "invalid";
    }
    if (activeAgentCount > 0 && scheduledActiveAgentCount > 0) {
      return "replace";
    }
    if (activeAgentCount > 0 && canRefreshIdleActiveSchedules && activeAgentCount === targetActiveCountValue) {
      return "refresh";
    }
    if (activeAgentCount > 0) {
      return "replace";
    }
    if (availablePausedAgentCount >= targetActiveCountValue) {
      return "resume";
    }
    return "setup";
  })();
  const canRunSecondaryRefresh = nextRunMode !== "refresh" && canRefreshIdleActiveSchedules;
  const showSecondaryOperations = canRunSecondaryRefresh;
  const operationStateLabel = (() => {
    if (scheduledActiveAgentCount > 0) return "운영 중";
    if (canRefreshIdleActiveSchedules) return "운영 종료됨";
    if (activeAgentCount > 0) return "설정 확인 필요";
    if (availablePausedAgentCount > 0) return "시작 가능";
    return "AI 부족";
  })();
  const nextRunActionLabel = (() => {
    if (nextRunMode === "replace") return "기존 예약 교체 후 시작";
    if (nextRunMode === "refresh") return "운영 다시 시작";
    if (nextRunMode === "resume") return "운영 시작";
    if (nextRunMode === "setup") return "신규 AI 독자 생성 열기";
    return "목표 인원 확인 필요";
  })();
  const nextRunHelpText = (() => {
    if (nextRunMode === "replace") {
      return "이미 남은 예약이 있어 새 설정을 적용하려면 기존 예약과 대기 액션을 새 설정으로 교체합니다. 실행 전 확인창이 뜹니다.";
    }
    if (nextRunMode === "refresh") {
      return "운영이 끝난 활성 AI를 현재 설정으로 다시 시작합니다.";
    }
    if (nextRunMode === "resume") {
      return "멈춰 있는 AI를 목표 인원만큼 켜고 현재 설정으로 운영을 시작합니다.";
    }
    if (nextRunMode === "setup") {
      return "투입 가능한 AI가 부족합니다. 먼저 신규 AI 독자를 생성하거나 목표 인원을 낮춰야 합니다.";
    }
    return "목표 활동 인원은 1~100명 사이로 입력하세요.";
  })();
  const llmSuccessRate = percentFormat(
    summary?.success_decision_count,
    summary?.decision_count
  );

  const handleStartConfiguredRun = async () => {
    try {
      setOperationMessage(null);
      if (nextRunMode === "invalid") {
        setOperationMessage(`목표 인원은 1~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`);
        return;
      }
      if (nextRunMode === "setup") {
        setBootstrapCount(String(targetActiveCountValue || MAX_AI_READER_AGENT_COUNT));
        setAgentSetupOpen(true);
        setOperationMessage("신규 AI 독자 생성 영역을 열었습니다. 사전 확인 후 투입 적용을 진행하세요.");
        return;
      }
      if (nextRunMode === "resume") {
        setResumeCount(String(targetActiveCountValue));
        await runResumePausedAgentOperation(
          targetActiveCountValue,
          "운영 시작 완료"
        );
        return;
      }
      if (nextRunMode === "refresh") {
        await runRefreshActiveSchedulesOperation(targetActiveCountValue);
        return;
      }
      await handleCleanRestart();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "운영 시작에 실패했습니다.");
    }
  };

  const productColumns: Column[] = [
    { header: "작품 ID", key: "product_id" },
    {
      header: "작품",
      key: "product_title",
      render: (_value, row) => (
        <div className="max-w-[240px] whitespace-normal text-xs font-medium leading-relaxed">
          {row.product_title || `작품 ${row.product_id}`}
        </div>
      ),
    },
    {
      header: "조회 증가",
      key: "ai_view_action_count",
      render: numberFormat,
    },
    {
      header: "선호작",
      key: "bookmark_effect",
      render: (_value, row) => (
        <div className="space-y-0.5 text-xs leading-relaxed">
          <div>추가 {numberFormat(row.ai_bookmark_add_action_count)}</div>
          <div className="text-muted-foreground">해제 {numberFormat(row.ai_bookmark_remove_action_count)}</div>
          <div className="font-medium">순증 {signedNumberFormat(row.ai_bookmark_net_action_count)}</div>
        </div>
      ),
    },
    {
      header: "추천",
      key: "recommend_effect",
      render: (_value, row) => (
        <div className="space-y-0.5 text-xs leading-relaxed">
          <div>추가 {numberFormat(row.ai_recommend_add_action_count)}</div>
          <div className="text-muted-foreground">해제 {numberFormat(row.ai_recommend_remove_action_count)}</div>
          <div className="font-medium">순증 {signedNumberFormat(row.ai_recommend_net_action_count)}</div>
        </div>
      ),
    },
    {
      header: "평가",
      key: "ai_evaluation_action_count",
      render: numberFormat,
    },
    {
      header: "마지막 활동",
      key: "last_ai_action_at",
      render: (value) => formatRecentActionTime(value),
    },
  ];

  const scopeKpis = [
    {
      label: "기간 AI 조회",
      value: summary?.ai_view_count,
      sub: `반영완료 활동 ${numberFormat(summary?.applied_action_count)}`,
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
      label: "활동 대기/처리중",
      value: `${numberFormat(summary?.queued_action_count)} / ${numberFormat(summary?.running_action_count)}`,
      sub: `미반영 ${numberFormat(summary?.skipped_action_count)} / 실패 ${numberFormat(summary?.failed_action_count)}`,
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
          <Button onClick={handleSearch}>기간 적용</Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>

        {/* 운영 status + 핵심 액션 */}
        <div className="order-1 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  활성 AI
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums leading-none">
                    {numberFormat(activeAgentCount)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    / 스케줄 있음 {numberFormat(scheduledActiveAgentCount)} / 할 일 없음{" "}
                    {numberFormat(idleActiveAgentCount)} / 투입 가능 {numberFormat(refreshableIdleActiveAgentCount)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  추가 가능 {numberFormat(availablePausedAgentCount)} / 꺼져 있는 AI{" "}
                  {numberFormat(pausedAgentCount)} / 등록 {numberFormat(totalAgentCount)}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] text-muted-foreground">선택 기간 스케줄</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums leading-none">
                    {numberFormat(summary?.today_schedule_count)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    / 열린 {numberFormat(summary?.open_schedule_count)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] text-muted-foreground">실패 스케줄</div>
                <div
                  className={`mt-1 text-2xl font-semibold tabular-nums leading-none ${
                    Number(summary?.failed_schedule_count || 0) > 0 ? "text-destructive" : ""
                  }`}
                >
                  {numberFormat(summary?.failed_schedule_count)}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="text-[11px] text-muted-foreground">LLM 성공률</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums leading-none">
                    {llmSuccessRate}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    대기 {numberFormat(summary?.pending_decision_count)} / 실패{" "}
                    {numberFormat(summary?.failed_decision_count)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">AI 독자 운영</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  설정값을 조정한 뒤 운영을 시작·재개하고, 독자 로그로 반응을 확인합니다.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handlePauseAllAgents}
                disabled={pendingOperation}
                className="text-destructive hover:text-destructive"
              >
                <CirclePause className="mr-2 h-4 w-4" />
                운영 멈추기
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,360px)_1fr]">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium">목표 활동 인원</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      inputMode="numeric"
                      value={targetActiveCount}
                      onChange={(e) => setTargetActiveCount(e.target.value.replace(/\D/g, ""))}
                      className="w-[110px]"
                    />
                    <span className="text-sm text-muted-foreground">명</span>
                  </div>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 50, 100].map((count) => (
                    <Button
                      key={count}
                      type="button"
                      variant={targetActiveCountValue === count ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetActiveCount(String(count))}
                    >
                      {count}명
                    </Button>
                  ))}
                </div>
                <div className="rounded-md border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                  {targetOperationMessage}
                  {targetOperation.kind === "needs_more_agents" && (
                    <div className="mt-1 text-destructive">
                      부족분 {numberFormat(targetOperation.missingCount)}명은 아래 신규 AI 독자 생성에서 먼저 보충한 뒤 다시 적용하세요.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {idleActiveAgentCount > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    스케줄 없는 활성 AI {numberFormat(idleActiveAgentCount)}명 중 운영 다시 시작 가능{" "}
                    {numberFormat(refreshableIdleActiveAgentCount)}명입니다.
                    {excludedIdleActiveAgentCount > 0 && (
                      <> 제외 {numberFormat(excludedIdleActiveAgentCount)}명은 계정 상태, 도메인, SNS 조건을 확인하세요.</>
                    )}
                    {refreshableIdleActiveAgentCount > 0 && (
                      <> 현재 설정으로 이어서 실험하려면 [운영 다시 시작]을 누르세요.</>
                    )}
                  </div>
                )}
                <div className="rounded-md border bg-white px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium">다음 작업</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {operationStateLabel} · 목표 {numberFormat(targetActiveCountValue)}명 · {plannedRunDurationLabel} ·{" "}
                        {startImmediately ? "바로 시작" : "예약 시간부터 시작"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {nextRunHelpText}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={nextRunMode === "replace" || nextRunMode === "invalid" ? "outline" : "default"}
                        onClick={handleStartConfiguredRun}
                        disabled={pendingOperation}
                      >
                        {nextRunMode === "replace" ? (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {nextRunActionLabel}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border bg-muted/10 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">운영 설정</span>
                        <span className="ml-2">
                          기간 <span className="font-medium text-foreground">{scheduleDateInput}~{scheduleEndDateInput}</span>
                          {" · "}기간 종료 후 남은 스케줄이 없으면 자동 일시정지
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {AI_READER_DURATION_OPTIONS.map((option) => (
                          <Button
                            key={option.days}
                            type="button"
                            variant={scheduleDurationDaysValue === option.days ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyScheduleDuration(option.days)}
                            disabled={pendingOperation}
                          >
                            {option.label}
                          </Button>
                        ))}
                        <Input
                          inputMode="numeric"
                          value={scheduleDurationDays}
                          onChange={(e) => {
                            setScheduleDurationDays(e.target.value.replace(/\D/g, ""));
                            resetDryRun();
                            resetResumeDryRun();
                          }}
                          className="h-8 w-[72px]"
                          disabled={pendingOperation}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant={startImmediately ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyStartMode(true)}
                        disabled={pendingOperation}
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        바로 시작
                      </Button>
                      <Button
                        type="button"
                        variant={!startImmediately ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyStartMode(false)}
                        disabled={pendingOperation}
                      >
                        예약 시간부터 시작
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAgentSetupOpen((open) => !open)}
                      >
                        {agentSetupOpen ? "상세 설정 접기" : "상세 설정 보기"}
                      </Button>
                    </div>
                  </div>
                </div>

                {showSecondaryOperations && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">예외 작업</span>
                    <Button
                      variant="outline"
                      onClick={handleRefreshIdleActiveSchedules}
                      disabled={pendingOperation || !canRefreshIdleActiveSchedules}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      운영 다시 시작 {refreshableIdleActiveAgentCount > 0 ? numberFormat(refreshableIdleActiveAgentCount) : ""}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {lastResumeDryRun && (
              <div className="mt-3 rounded-md border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {isRestartDryRun ? "기존 예약 교체 확인" : "최근 확인"}:{" "}
                {isRestartDryRun ? "시작 가능 AI" : "추가 투입 가능한 대기 AI"}{" "}
                {numberFormat(lastResumeDryRun.availableAgentCount)}명 / 부족{" "}
                {numberFormat(lastResumeDryRun.missingAgentCount)}명 / 선택{" "}
                {numberFormat(lastResumeDryRun.preview.length)}명 / 기간 {lastResumeDryRun.scheduleDate}~
                {lastResumeDryRun.scheduleEndDate}
                {countImmediateScheduleRows(lastResumeDryRun.immediateSchedulePreview) > 0 && (
                  <>
                    {" "}
                    / 오늘 즉시 {numberFormat(countImmediateScheduleRows(lastResumeDryRun.immediateSchedulePreview))}명
                  </>
                )}
                {showResumeDryRunMismatch && (
                  <span className="ml-1 text-destructive">· 입력과 결과 불일치</span>
                )}
              </div>
            )}
          </div>

          {operationMessage && (
            <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs">
              {operationMessage}
            </div>
          )}
        </div>

        {/* 최근 활동 (메인) + 시간대 활동 차트 (보조) — 2-컬럼 */}
        <div className="order-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* 최근 활동 피드 */}
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">최근 반영 활동</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  실제 반영된 최근 30건. 한 줄을 누르면 해당 AI 독자의 상세 로그로 이동합니다.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={actionTimelineHref}>독자 로그 보기</Link>
              </Button>
            </div>
            <div className="max-h-[340px] overflow-y-auto -mx-4 px-4">
              {data?.recent_actions && data.recent_actions.length > 0 ? (
                <ul className="divide-y">
                  {data.recent_actions.map((row) => (
                    <li key={row.ai_reader_action_id}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/statistics/ai-reader/agents?agent_id=${row.ai_reader_agent_id}`)
                        }
                        className="block w-full py-2 text-left text-xs leading-relaxed hover:bg-muted/30"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="tabular-nums text-muted-foreground">
                            {formatRecentActionTime(row.applied_at || row.created_date)}
                          </span>
                          <span className="font-medium">
                            {formatAiReaderDisplayName(row.agent_key, row.ai_reader_agent_id)}
                          </span>
                          {(row.age_group || row.gender) && (
                            <span className="text-[10px] text-muted-foreground">
                              ({row.age_group || "-"}/{row.gender || "-"})
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-muted-foreground">
                          <span className="text-foreground">
                            &lt;{row.product_title || `작품 ${row.product_id}`}&gt;
                          </span>
                          에 {formatRecentActionLabel(row.action_type, row.target_value)}
                          <span
                            className={`ml-2 text-[10px] ${aiReaderActionToneClassName(
                              row.status,
                              row.action_type,
                              row.target_value
                            )}`}
                          >
                            {formatAiReaderActionScoreLabel(row.action_type, row.target_value, row.status)}
                          </span>
                          {row.status !== "applied" && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({formatAiReaderActionStatusLabel(row.status)})
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed bg-muted/10 text-xs text-muted-foreground">
                  선택한 기간에 반영된 활동이 없습니다.
                </div>
              )}
            </div>
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
              (data?.hourly_summary && data.hourly_summary.length > 0)
                ? <AiReaderHourlyBarChart data={data.hourly_summary} height={260} />
                : <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed bg-muted/10 text-xs text-muted-foreground">
                    선택한 기간에 시간대 활동 데이터가 아직 없습니다.
                  </div>
            )}
          </div>
        </div>

        {/* 작품별 AI 활동 효과 */}
        <div className="order-4 rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">작품별 AI 활동 효과</h2>
            <span className="text-sm text-muted-foreground">
              총 {numberFormat(data?.total_count)}개 작품
            </span>
          </div>
          <CommonTable
            columns={productColumns}
            data={data?.results || []}
            loading={isLoadingData || isFetching}
            emptyMessage="AI 활동 효과 데이터가 없습니다."
          />
          <div className="mt-4">
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={calculatePageCount(data?.total_count || 0, AI_READER_EFFECTS_PER_PAGE)}
            />
          </div>
        </div>

        {/* 운영 설정/프리셋 관리 */}
        {agentSetupOpen && (
        <div className="order-2 rounded-lg border bg-white p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">활동 방식 설정 (상세)</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              운영 순서: 프리셋 선택 → 설정 조정 → 운영 시작 또는 다시 시작 → 부족하면 하단 [신규 AI 독자 생성]에서 추가.
            </p>
            <div className="mt-2 rounded-md border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">현재 활동값</span>: {activitySettingSummary}
              <span className="mx-2">·</span>
              <span className="font-medium text-foreground">기간·시작</span>: {scheduleSettingSummary}
            </div>
          </div>

          {/* Step 1. 강도 + 프리셋 */}
          <div className="mb-5 rounded-md border bg-muted/10 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                1
              </span>
              <h3 className="text-xs font-medium">먼저 고르기: 프리셋과 활동량</h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11px] text-muted-foreground">활동량 강도</div>
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
                  예상 {numberFormat(estimatedDailySessions)}세션/일 · 기간 총{" "}
                  {numberFormat(estimatedPeriodSessions)}세션 · LLM 예산 최대{" "}
                  {numberFormat(estimatedDailyLlmBudget)}회/일
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] text-muted-foreground">프리셋 적용 (강도·수·시간·비율을 한 번에 채움)</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allPresets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div key={preset.id} className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-auto min-h-10 w-full whitespace-normal px-2 py-2 text-xs ${
                            isSelected
                              ? "border-foreground ring-1 ring-foreground/40 bg-muted/40"
                              : ""
                          }`}
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2. 투입 설정 */}
          <div className="mb-5 rounded-md border bg-muted/10 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                2
              </span>
              <h3 className="text-xs font-medium">조정하기: 인원·기간·시작 방식</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">신규 AI 독자 이메일 prefix</span>
                <Input
                  placeholder="ai-reader-"
                  value={bootstrapPrefix}
                  onChange={(e) => {
                    setBootstrapPrefix(e.target.value);
                    resetDryRun();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">스케줄 날짜</span>
                <Input
                  type="date"
                  value={scheduleDateInput}
                  onChange={(e) => {
                    setScheduleDateInput(e.target.value);
                    resetDryRun();
                    resetResumeDryRun();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">신규 AI 독자 수 (명)</span>
                <Input
                  inputMode="numeric"
                  placeholder="100"
                  value={bootstrapCount}
                  onChange={(e) => {
                    setBootstrapCount(e.target.value.replace(/\D/g, ""));
                    resetDryRun();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">세션 목표 (회/일·명당)</span>
                <Input
                  inputMode="numeric"
                  placeholder="2"
                  value={dailySessionTargetInput}
                  onChange={(e) => {
                    setDailySessionTargetInput(e.target.value.replace(/\D/g, ""));
                    resetDryRun();
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">LLM 예산 (회/일·명당)</span>
                <Input
                  inputMode="numeric"
                  placeholder="8"
                  value={dailyLlmBudgetInput}
                  onChange={(e) => {
                    setDailyLlmBudgetInput(e.target.value.replace(/\D/g, ""));
                    resetDryRun();
                  }}
                />
              </label>
            </div>

            <div className="mt-4 rounded-md border bg-white p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-medium">스케줄 생성 기간</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {scheduleDateInput} ~ {scheduleEndDateInput} · 기간 종료 후 자동 일시정지
                  </div>
                </div>
                <Input
                  inputMode="numeric"
                  value={scheduleDurationDays}
                  onChange={(e) => {
                    setScheduleDurationDays(e.target.value.replace(/\D/g, ""));
                    resetDryRun();
                    resetResumeDryRun();
                  }}
                  className="h-8 w-[72px]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AI_READER_DURATION_OPTIONS.map((option) => (
                  <Button
                    key={option.days}
                    type="button"
                    variant={scheduleDurationDaysValue === option.days ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyScheduleDuration(option.days)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-md border bg-white p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-medium">매일 반복 활동 시간</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    반복 시간: {activeHoursValue.length ? activeHoursValue.join(", ") : "-"}
                  </div>
                </div>
                <Input
                  placeholder="6,7,12,20,21,22"
                  value={activeHoursInput}
                  onChange={(e) => {
                    setActiveHoursInput(e.target.value);
                    resetDryRun();
                  }}
                  className="w-[220px]"
                />
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours([7, 8, 12, 18, 19, 20, 21, 22])}>
                  출퇴근+점심+저녁
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours(rangeHours(0, 24))}>
                  하루 전체
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours(rangeHours(0, 6))}>
                  새벽 0~6
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours(rangeHours(6, 11))}>
                  아침 6~11
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours(rangeHours(12, 18))}>
                  오후 12~18
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyActiveHours(rangeHours(18, 24))}>
                  저녁 18~24
                </Button>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 6].map((intervalHour) => (
                  <Button
                    key={intervalHour}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      applyActiveHours(rangeHours(0, 24).filter((hour) => hour % intervalHour === 0))
                    }
                  >
                    {intervalHour}시간 단위
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-12 gap-1">
                {rangeHours(0, 24).map((hour) => {
                  const selected = activeHoursValue.includes(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleActiveHour(hour)}
                      className={`h-8 rounded-md border text-[11px] ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-md border bg-white p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-medium">시작 방식</span>
                  <Button
                    type="button"
                    variant={!startImmediately ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyStartMode(false)}
                  >
                    예약 시간부터 시작
                  </Button>
                  <Button
                    type="button"
                    variant={startImmediately ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyStartMode(true)}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    바로 시작
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  바로 시작은 날짜를 오늘로 맞추고 1회성 즉시 배치를 추가합니다.
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[11px] text-muted-foreground">분할 단위</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: "auto", label: "자동 추천" },
                      { value: "10", label: "10명씩" },
                      { value: "20", label: "20명씩" },
                      { value: "25", label: "25명씩" },
                      { value: "50", label: "50명씩" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={immediateBatchSizeMode === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setImmediateBatchSizeMode(option.value);
                          if (option.value !== "auto") setImmediateBatchSizeInput(option.value);
                          resetDryRun();
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Input
                      inputMode="numeric"
                      value={immediateBatchSizeInput}
                      onFocus={() => {
                        setImmediateBatchSizeMode("custom");
                        resetDryRun();
                      }}
                      onChange={(e) => {
                        setImmediateBatchSizeMode("custom");
                        setImmediateBatchSizeInput(e.target.value.replace(/\D/g, ""));
                        resetDryRun();
                      }}
                      className="h-8 w-[72px]"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] text-muted-foreground">배치 간격</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 30].map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        variant={immediateBatchIntervalValue === minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setImmediateBatchIntervalInput(String(minutes));
                          resetDryRun();
                        }}
                      >
                        {minutes}분
                      </Button>
                    ))}
                    <Input
                      inputMode="numeric"
                      value={immediateBatchIntervalInput}
                      onChange={(e) => {
                        setImmediateBatchIntervalInput(e.target.value.replace(/\D/g, ""));
                        resetDryRun();
                      }}
                      className="h-8 w-[72px]"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-md border bg-muted/20 p-2">
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">예상 활동 일정</div>
                {visibleImmediateSchedulePreview.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {visibleImmediateSchedulePreview.slice(0, 10).map((item, index) => (
                      <span key={`${item.active_start_at}-${index}`} className="rounded-md border bg-white px-2 py-1">
                        {formatSchedulePreviewTime(item.active_start_at)} · {numberFormat(item.agent_count)}명
                      </span>
                    ))}
                    {visibleImmediateSchedulePreview.length > 10 && (
                      <span className="rounded-md border bg-white px-2 py-1">
                        +{numberFormat(visibleImmediateSchedulePreview.length - 10)}개
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">
                    즉시 배치 없음. 선택한 활동 시간 기준으로 예약 스케줄만 생성됩니다.
                  </div>
                )}
              </div>
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

          {/* 신규 AI 독자 생성 */}
          <div className="-mx-4 mt-5 border-t bg-muted/10 px-4 pb-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium">신규 AI 독자 생성</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  이미 발급된 AI 전용 ready 계정을 AI 독자로 등록하고, 위 활동 방식으로 스케줄을 생성합니다. 계정이 부족하면 먼저 전용 계정을 발급해야 합니다.
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBootstrap(false)}
                  disabled={pendingOperation}
                >
                  1. 사전 확인
                </Button>
                <Button
                  onClick={() => handleBootstrap(true)}
                  disabled={pendingOperation || !hasMatchingDryRun}
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
                  {numberFormat(lastDryRun.missingUserCount)}명 / 기간 {lastDryRun.scheduleDate}~
                  {lastDryRun.scheduleEndDate} / 총 예상{" "}
                  {numberFormat(lastDryRunEstimatedScheduleCount)}개 / 반복{" "}
                  {numberFormat(lastDryRunRepeatingScheduleCount)}개
                  {lastDryRunImmediateScheduleCount > 0 && (
                    <>
                      {" "}
                      / 오늘 즉시 {numberFormat(lastDryRunImmediateScheduleCount)}개
                    </>
                  )}
                </div>
                {lastDryRun.immediateSchedulePreview.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {lastDryRun.immediateSchedulePreview.slice(0, 8).map((item, index) => (
                      <span key={`${item.active_start_at}-${index}`} className="rounded-md border bg-white px-2 py-1">
                        {formatSchedulePreviewTime(item.active_start_at)} · {numberFormat(item.agent_count)}명
                      </span>
                    ))}
                  </div>
                )}
                {bootstrapDryRunBlockMessage && (
                  <div className={cn(
                    "mt-1",
                    lastDryRun.missingUserCount > 0 ? "text-amber-700" : "text-destructive"
                  )}>
                    {bootstrapDryRunBlockMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 기간 반응 KPI */}
        <div className="order-5 rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">선택 범위 반응</h2>
            <span className="text-xs text-muted-foreground">
              전체 작품 기준
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

        {/* 개별 관리 페이지 진입 */}
        <Link
          href="/statistics/ai-reader/agents"
          className="order-6 flex items-center justify-between rounded-lg border bg-white p-4 transition hover:bg-muted/30"
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

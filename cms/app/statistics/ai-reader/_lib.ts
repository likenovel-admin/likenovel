// AI 독자 페이지 공통 helper / 상수
// page.tsx (운영 대시보드) 와 agents/page.tsx (개별 관리) 모두에서 사용한다.

export const numberFormat = (value: unknown) => Number(value || 0).toLocaleString();

export const percentFormat = (part: unknown, total: unknown) => {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  if (!denominator) return "-";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
};

const formatSignedScore = (score: number) => (score > 0 ? `+${score}` : String(score));

export const getAiReaderActionScore = (
  actionType: string | null | undefined,
  targetValue: string | null | undefined
) => {
  const type = String(actionType || "").toLowerCase();
  if (type === "read") return 1;
  if (type === "evaluate") return 3;
  if (type === "drop") return -2;
  if (type === "bookmark") return targetValue === "N" ? -4 : 4;
  if (type === "recommend") return targetValue === "N" ? -5 : 5;
  return 0;
};

export const formatAiReaderActionScoreLabel = (
  actionType: string | null | undefined,
  targetValue: string | null | undefined,
  status?: string | null
) => {
  const rawStatus = String(status || "").toLowerCase();
  const score = getAiReaderActionScore(actionType, targetValue);
  if (rawStatus === "failed") return "활동점수 0";
  if (rawStatus === "skipped") return "미반영 0";
  if (rawStatus === "queued" || rawStatus === "running") {
    return `예상점수 ${formatSignedScore(score)}`;
  }
  return `활동점수 ${formatSignedScore(score)}`;
};

export const formatAiReaderActionStatusLabel = (status?: string | null) => {
  const rawStatus = String(status || "").toLowerCase();
  if (rawStatus === "applied") return "반영완료";
  if (rawStatus === "skipped") return "미반영";
  if (rawStatus === "failed") return "실패";
  if (rawStatus === "queued") return "대기중";
  if (rawStatus === "running") return "처리중";
  return status || "-";
};

export const aiReaderActionToneClassName = (
  status?: string | null,
  actionType?: string | null,
  targetValue?: string | null
) => {
  const rawStatus = String(status || "").toLowerCase();
  if (rawStatus === "failed") return "text-destructive";
  if (rawStatus === "skipped") return "text-muted-foreground";
  if (rawStatus === "queued" || rawStatus === "running") return "text-amber-600";
  if (getAiReaderActionScore(actionType, targetValue) < 0) return "text-destructive";
  return "text-emerald-600";
};

export const formatHours = (hours?: number[]) => {
  if (!hours?.length) return "-";
  return hours.map((hour) => `${String(hour).padStart(2, "0")}시`).join(", ");
};

export const parseHoursInput = (value: string) => {
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

export const genderLabel: Record<string, string> = {
  M: "남성",
  F: "여성",
  X: "기타",
  unknown: "미상",
};

export const ageGroupLabel: Record<string, string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
};

export const ageGroupKeys = ["10s", "20s", "30s", "40s", "50s"];
export const genderKeys = ["M", "F"];

export const MAX_AI_READER_AGENT_COUNT = 200;
export const MAX_AI_READER_IMMEDIATE_BATCH_SIZE = 100;
export const AI_READER_PRESET_STORAGE_KEY = "likenovel.cms.aiReader.customPresets.v1";

export type AiReaderAgentKeyItem = {
  agent_key?: string | null;
};

export const parseAiReaderAgentIndex = (agentKey?: string | null) => {
  const match = /^ai-reader-(\d+)$/.exec(String(agentKey || ""));
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 ? index : null;
};

export const getAiReaderAgentListLastPage = (
  totalCount: unknown,
  countPerPage = MAX_AI_READER_AGENT_COUNT
) => {
  const safeTotalCount = Math.max(0, Number(totalCount || 0));
  const safeCountPerPage = Math.max(1, Number(countPerPage || 1));
  return Math.max(1, Math.ceil(safeTotalCount / safeCountPerPage));
};

export const getNextAiReaderAgentIndexOffset = (
  agents: AiReaderAgentKeyItem[],
  fallbackCount: unknown = 0
) => {
  const maxIndex = agents.reduce((currentMaxIndex, agent) => {
    const index = parseAiReaderAgentIndex(agent.agent_key);
    return index === null ? currentMaxIndex : Math.max(currentMaxIndex, index);
  }, -1);
  return Math.max(maxIndex + 1, Math.max(0, Number(fallbackCount || 0)));
};

export type AiReaderIntensity = "LOW" | "MEDIUM" | "HIGH";
export type RatioMap = Record<string, number>;

export type AiReaderPreset = {
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
  productTypeWeights: RatioMap;
  freeProductTypeWeights: RatioMap;
};

export const defaultAgeGroupRatios: RatioMap = {
  "10s": 8,
  "20s": 23,
  "30s": 36,
  "40s": 29,
  "50s": 4,
};

export const defaultGenderRatios: RatioMap = {
  M: 52,
  F: 48,
};

export const defaultProductTypeWeights: RatioMap = {
  free_serial: 100,
  paid_serial: 0,
};

export const defaultFreeProductTypeWeights: RatioMap = {
  normal_serial: 85,
  free_serial: 15,
};

export const intensityDefaults: Record<
  AiReaderIntensity,
  Pick<AiReaderPreset, "activeHours" | "dailySessionTarget" | "dailyLlmBudget">
> = {
  LOW: {
    activeHours: [7, 12, 20, 21],
    dailySessionTarget: 1,
    dailyLlmBudget: 4,
  },
  MEDIUM: {
    activeHours: [6, 7, 12, 20, 21, 22],
    dailySessionTarget: 2,
    dailyLlmBudget: 8,
  },
  HIGH: {
    activeHours: [6, 7, 8, 12, 18, 19, 20, 21, 22, 23],
    dailySessionTarget: 4,
    dailyLlmBudget: 12,
  },
};

export const defaultPresets: AiReaderPreset[] = [
  {
    id: "default-low",
    name: "프리셋1 LOW",
    locked: true,
    intensity: "LOW",
    agentCount: 50,
    ageGroupRatios: defaultAgeGroupRatios,
    genderRatios: defaultGenderRatios,
    productTypeWeights: defaultProductTypeWeights,
    freeProductTypeWeights: defaultFreeProductTypeWeights,
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
    productTypeWeights: defaultProductTypeWeights,
    freeProductTypeWeights: defaultFreeProductTypeWeights,
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
    productTypeWeights: defaultProductTypeWeights,
    freeProductTypeWeights: defaultFreeProductTypeWeights,
    ...intensityDefaults.HIGH,
  },
];

export const sumRatios = (ratios: RatioMap) =>
  Object.values(ratios).reduce((sum, value) => sum + Number(value || 0), 0);

export const readCustomPresets = (): AiReaderPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_READER_PRESET_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.name === "string");
  } catch {
    return [];
  }
};

export const writeCustomPresets = (presets: AiReaderPreset[]) => {
  window.localStorage.setItem(AI_READER_PRESET_STORAGE_KEY, JSON.stringify(presets));
};

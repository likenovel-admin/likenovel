import { MAX_AI_READER_AGENT_COUNT } from "./limits";

export type AiReaderTargetOperationKind =
  | "invalid"
  | "no_change"
  | "pause_all"
  | "resume"
  | "needs_more_agents"
  | "partial_decrease_unsupported";

export type AiReaderTargetOperation = {
  kind: AiReaderTargetOperationKind;
  activeCount: number;
  totalCount: number;
  pausedCount: number;
  targetCount: number;
  deltaCount: number;
  missingCount: number;
  message: string;
};

export const getAiReaderTargetOperation = ({
  activeCount,
  totalCount,
  availablePausedCount,
  targetCount,
}: {
  activeCount: number;
  totalCount: number;
  availablePausedCount?: number;
  targetCount: number;
}): AiReaderTargetOperation => {
  const safeActiveCount = Math.max(0, Number(activeCount || 0));
  const safeTotalCount = Math.max(safeActiveCount, Number(totalCount || 0));
  const safeAvailablePausedCount =
    availablePausedCount === undefined
      ? Math.max(0, safeTotalCount - safeActiveCount)
      : Math.max(0, Number(availablePausedCount || 0));
  const safeTargetCount = Number(targetCount || 0);
  const pausedCount = safeAvailablePausedCount;
  const base = {
    activeCount: safeActiveCount,
    totalCount: safeTotalCount,
    pausedCount,
    targetCount: safeTargetCount,
    deltaCount: safeTargetCount - safeActiveCount,
    missingCount: 0,
  };

  if (
    !Number.isInteger(safeTargetCount)
    || safeTargetCount < 0
    || safeTargetCount > MAX_AI_READER_AGENT_COUNT
  ) {
    return {
      ...base,
      kind: "invalid",
      message: `목표 인원은 0~${MAX_AI_READER_AGENT_COUNT}명 사이로 입력하세요.`,
    };
  }

  if (safeTargetCount === safeActiveCount) {
    return {
      ...base,
      kind: "no_change",
      message: `현재 ${safeActiveCount.toLocaleString()}명과 목표 ${safeTargetCount.toLocaleString()}명이 같습니다. 변경할 인원이 없습니다.`,
    };
  }

  if (safeTargetCount === 0) {
    return {
      ...base,
      kind: "pause_all",
      message: `현재 ${safeActiveCount.toLocaleString()}명을 모두 일시정지하고 남은 스케줄을 정리합니다.`,
    };
  }

  if (safeTargetCount > safeActiveCount) {
    const deltaCount = safeTargetCount - safeActiveCount;
    if (deltaCount > pausedCount) {
      return {
        ...base,
        kind: "needs_more_agents",
        missingCount: deltaCount - pausedCount,
        message: `현재 활동 중인 AI는 ${safeActiveCount.toLocaleString()}명입니다. 목표 ${safeTargetCount.toLocaleString()}명으로 늘리려면 추가 ${deltaCount.toLocaleString()}명이 필요하지만, 추가 투입 가능한 대기 AI는 ${pausedCount.toLocaleString()}명뿐입니다.`,
      };
    }
    return {
      ...base,
      kind: "resume",
      message: `현재 ${safeActiveCount.toLocaleString()}명에서 목표 ${safeTargetCount.toLocaleString()}명으로 맞추기 위해 ${deltaCount.toLocaleString()}명을 추가 투입합니다.`,
    };
  }

  return {
    ...base,
    kind: "partial_decrease_unsupported",
    message: `현재 ${safeActiveCount.toLocaleString()}명에서 목표 ${safeTargetCount.toLocaleString()}명으로 줄이려면 일부 독자만 일시정지하는 API가 필요합니다. 지금은 0명 정리 또는 클린 재시작을 사용하세요.`,
  };
};

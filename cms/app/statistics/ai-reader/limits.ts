export const MAX_AI_READER_AGENT_COUNT = 1000;
export const AI_READER_IMMEDIATE_BATCH_SIZE_CAP = 100;
export const AI_READER_TARGET_QUICK_COUNTS = [0, 50, 100, 500, 1000] as const;

export const getRecommendedImmediateBatchSize = (agentCount: number) => {
  if (agentCount <= 20) return Math.max(1, agentCount || 1);
  if (agentCount <= 50) return 10;
  if (agentCount <= 200) return 20;
  if (agentCount <= 500) return 50;
  return AI_READER_IMMEDIATE_BATCH_SIZE_CAP;
};

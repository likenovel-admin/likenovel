const aiReaderDisplayNameStems = [
  "새벽서가",
  "문장수집",
  "느린독서",
  "밤의책갈피",
  "연재탐색",
  "장면기록",
  "취향서랍",
  "다음회차",
  "몰입독자",
  "완독메모",
];

const extractTrailingNumber = (value?: string | null) => {
  const match = String(value || "").match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) ? parsed : null;
};

export const formatAiReaderDisplayName = (
  agentKey?: string | null,
  agentId?: number | null,
) => {
  const agentIndex = extractTrailingNumber(agentKey);
  const fallbackIndex = typeof agentId === "number" && agentId > 0 ? agentId - 1 : 0;
  const displayIndex = agentIndex ?? fallbackIndex;
  const sequence = displayIndex + 1;
  const stem = aiReaderDisplayNameStems[Math.abs(displayIndex) % aiReaderDisplayNameStems.length];
  return `${stem}-${String(sequence).padStart(3, "0")}`;
};

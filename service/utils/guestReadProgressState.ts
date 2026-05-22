export const GUEST_READ_PROGRESS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const GUEST_READ_PROGRESS_MAX_ITEMS = 100;
const GUEST_READ_PROGRESS_VERSION = 1;

export interface GuestReadProgressRecord {
  productId: number;
  episodeId: number;
  episodeNo: number;
  episodeTitle: string;
  updatedAt: number;
}

export interface GuestReadProgressState {
  version: 1;
  records: GuestReadProgressRecord[];
}

const emptyState = (): GuestReadProgressState => ({
  version: GUEST_READ_PROGRESS_VERSION,
  records: [],
});

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const normalizeEpisodeTitle = (value: unknown): string =>
  typeof value === "string" ? value : "";

const isRecordUsable = (
  record: Partial<GuestReadProgressRecord> | null | undefined,
  now: number
): record is GuestReadProgressRecord => {
  if (!record) return false;
  if (!isPositiveInteger(record.productId)) return false;
  if (!isPositiveInteger(record.episodeId)) return false;
  if (!isPositiveInteger(record.episodeNo)) return false;
  if (typeof record.updatedAt !== "number") return false;
  if (now - record.updatedAt > GUEST_READ_PROGRESS_TTL_MS) return false;
  return true;
};

const parseState = (
  state: GuestReadProgressState | null | undefined
): GuestReadProgressState => {
  if (!state || !Array.isArray(state.records)) return emptyState();
  return {
    version: GUEST_READ_PROGRESS_VERSION,
    records: state.records,
  };
};

export const pruneGuestReadProgressState = (
  state: GuestReadProgressState | null | undefined,
  now: number = Date.now()
): GuestReadProgressState => {
  const deduped = new Map<number, GuestReadProgressRecord>();

  for (const record of parseState(state).records) {
    if (!isRecordUsable(record, now)) continue;
    const previous = deduped.get(record.productId);
    if (!previous || previous.updatedAt < record.updatedAt) {
      deduped.set(record.productId, {
        productId: record.productId,
        episodeId: record.episodeId,
        episodeNo: record.episodeNo,
        episodeTitle: normalizeEpisodeTitle(record.episodeTitle),
        updatedAt: record.updatedAt,
      });
    }
  }

  return {
    version: GUEST_READ_PROGRESS_VERSION,
    records: Array.from(deduped.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, GUEST_READ_PROGRESS_MAX_ITEMS),
  };
};

export const upsertGuestReadProgressState = (
  state: GuestReadProgressState | null | undefined,
  record: GuestReadProgressRecord,
  now: number = Date.now()
): GuestReadProgressState => {
  if (!isRecordUsable({ ...record, updatedAt: now }, now)) {
    return pruneGuestReadProgressState(state, now);
  }

  const nextRecord: GuestReadProgressRecord = {
    productId: record.productId,
    episodeId: record.episodeId,
    episodeNo: record.episodeNo,
    episodeTitle: normalizeEpisodeTitle(record.episodeTitle),
    updatedAt: now,
  };

  const withoutProduct = parseState(state).records.filter(
    (item) => item.productId !== nextRecord.productId
  );

  return pruneGuestReadProgressState(
    {
      version: GUEST_READ_PROGRESS_VERSION,
      records: [nextRecord, ...withoutProduct],
    },
    now
  );
};

export const getGuestReadProgressFromState = (
  state: GuestReadProgressState | null | undefined,
  productId: number,
  now: number = Date.now()
): GuestReadProgressRecord | null => {
  if (!isPositiveInteger(productId)) return null;
  const pruned = pruneGuestReadProgressState(state, now);
  return pruned.records.find((record) => record.productId === productId) ?? null;
};

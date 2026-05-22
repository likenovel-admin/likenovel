import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "./localStorage";
import {
  getGuestReadProgressFromState,
  upsertGuestReadProgressState,
  type GuestReadProgressRecord,
  type GuestReadProgressState,
} from "./guestReadProgressState";

export {
  GUEST_READ_PROGRESS_MAX_ITEMS,
  GUEST_READ_PROGRESS_TTL_MS,
  getGuestReadProgressFromState,
  pruneGuestReadProgressState,
  upsertGuestReadProgressState,
  type GuestReadProgressRecord,
  type GuestReadProgressState,
} from "./guestReadProgressState";

export const getGuestReadProgress = (
  productId: number,
  now: number = Date.now()
): GuestReadProgressRecord | null => {
  const state = getLocalStorage<GuestReadProgressState>(
    STORAGE_KEYS.GUEST_READ_PROGRESS
  );
  return getGuestReadProgressFromState(state, productId, now);
};

export const setGuestReadProgress = (
  record: Omit<GuestReadProgressRecord, "updatedAt">,
  now: number = Date.now()
): boolean => {
  const state = getLocalStorage<GuestReadProgressState>(
    STORAGE_KEYS.GUEST_READ_PROGRESS
  );
  const nextState = upsertGuestReadProgressState(
    state,
    {
      ...record,
      updatedAt: now,
    },
    now
  );

  return setLocalStorage(STORAGE_KEYS.GUEST_READ_PROGRESS, nextState);
};

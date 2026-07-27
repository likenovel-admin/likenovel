import assert from "node:assert/strict";
import {
  GUEST_READ_PROGRESS_MAX_ITEMS,
  GUEST_READ_PROGRESS_TTL_MS,
  getGuestReadProgressFromState,
  pruneGuestReadProgressState,
  upsertGuestReadProgressState,
  type GuestReadProgressRecord,
  type GuestReadProgressState,
} from "./guestReadProgressState.ts";
import {
  GUEST_FREE_EPISODE_LIMIT,
  isGuestEpisodeLoginRequired,
} from "./guestEpisodeAccess.ts";

const now = Date.UTC(2026, 4, 20, 10, 0, 0);

const record = (
  productId: number,
  updatedAt: number,
  extra?: Partial<GuestReadProgressRecord>
): GuestReadProgressRecord => ({
  productId,
  episodeId: productId * 10,
  episodeNo: productId,
  episodeTitle: `episode-${productId}`,
  updatedAt,
  ...extra,
});

const buildState = (
  records: GuestReadProgressRecord[]
): GuestReadProgressState => ({
  version: 1,
  records,
});

{
  const state = upsertGuestReadProgressState(
    buildState([]),
    record(1, now, { episodeId: 101, episodeNo: 3, episodeTitle: "3화" }),
    now
  );

  assert.equal(state.records.length, 1);
  assert.deepEqual(getGuestReadProgressFromState(state, 1, now), {
    productId: 1,
    episodeId: 101,
    episodeNo: 3,
    episodeTitle: "3화",
    updatedAt: now,
  });
}

{
  const state = upsertGuestReadProgressState(
    buildState([record(1, now - 1000, { episodeId: 101 })]),
    record(1, now, { episodeId: 102, episodeNo: 2, episodeTitle: "2화" }),
    now
  );

  assert.equal(state.records.length, 1);
  assert.equal(getGuestReadProgressFromState(state, 1, now)?.episodeId, 102);
}

{
  const expiredAt = now - GUEST_READ_PROGRESS_TTL_MS - 1;
  const state = buildState([record(1, expiredAt), record(2, now)]);

  assert.equal(getGuestReadProgressFromState(state, 1, now), null);
  assert.deepEqual(
    pruneGuestReadProgressState(state, now).records.map((item) => item.productId),
    [2]
  );
}

{
  const state = pruneGuestReadProgressState(
    buildState([
      {
        ...record(1, now),
        episodeTitle: 123 as unknown as string,
      },
    ]),
    now
  );

  assert.equal(state.records[0].episodeTitle, "");
}

{
  const records = Array.from({ length: GUEST_READ_PROGRESS_MAX_ITEMS + 5 }, (_, index) =>
    record(index + 1, now - index)
  );
  const state = pruneGuestReadProgressState(buildState(records), now);

  assert.equal(state.records.length, GUEST_READ_PROGRESS_MAX_ITEMS);
  assert.equal(state.records[0].productId, 1);
  assert.equal(
    state.records[state.records.length - 1].productId,
    GUEST_READ_PROGRESS_MAX_ITEMS
  );
}

assert.equal(GUEST_FREE_EPISODE_LIMIT, 25);
assert.equal(
  isGuestEpisodeLoginRequired({
    isAuthenticated: false,
    episodePriceType: "free",
    episodeNo: 25,
  }),
  false
);
assert.equal(
  isGuestEpisodeLoginRequired({
    isAuthenticated: false,
    episodePriceType: "free",
    episodeNo: 26,
  }),
  true
);
assert.equal(
  isGuestEpisodeLoginRequired({
    isAuthenticated: false,
    episodePriceType: "paid",
    episodeNo: 25,
  }),
  true
);
assert.equal(
  isGuestEpisodeLoginRequired({
    isAuthenticated: true,
    episodePriceType: "paid",
    episodeNo: 26,
  }),
  false
);

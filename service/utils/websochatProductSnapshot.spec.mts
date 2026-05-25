import assert from "node:assert/strict";
import {
  areWebsochatProductSnapshotsEqual,
  getStableWebsochatProductSnapshot,
} from "./websochatProductSnapshot.ts";

const currentSnapshot = {
  productId: 787,
  title: "삼국지",
  authorNickname: "작가",
  coverImagePath: "/images/covers/787.webp",
  statusCode: "READY",
  latestEpisodeNo: 1137,
  publishedLatestEpisodeNo: 1137,
  syncedLatestEpisodeNo: 1136,
  contextStatus: "ready",
};

const equivalentSnapshot = { ...currentSnapshot };

assert.notEqual(equivalentSnapshot, currentSnapshot);
assert.equal(
  areWebsochatProductSnapshotsEqual(currentSnapshot, equivalentSnapshot),
  true,
);
assert.equal(
  getStableWebsochatProductSnapshot(currentSnapshot, equivalentSnapshot),
  currentSnapshot,
);

const updatedSnapshot = {
  ...equivalentSnapshot,
  syncedLatestEpisodeNo: 1137,
};

assert.equal(
  areWebsochatProductSnapshotsEqual(currentSnapshot, updatedSnapshot),
  false,
);
assert.equal(
  getStableWebsochatProductSnapshot(currentSnapshot, updatedSnapshot),
  updatedSnapshot,
);

assert.equal(
  areWebsochatProductSnapshotsEqual(null, equivalentSnapshot),
  false,
);

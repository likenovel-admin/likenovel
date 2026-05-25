export type WebsochatProductSnapshotComparable = {
  productId?: number | null;
  title?: string | null;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  statusCode?: string | null;
  latestEpisodeNo?: number | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
};

const nullable = <T>(value: T | null | undefined) => value ?? null;

export const areWebsochatProductSnapshotsEqual = (
  current?: WebsochatProductSnapshotComparable | null,
  next?: WebsochatProductSnapshotComparable | null,
) => {
  if (!current || !next) return false;

  return (
    nullable(current.productId) === nullable(next.productId)
    && nullable(current.title) === nullable(next.title)
    && nullable(current.authorNickname) === nullable(next.authorNickname)
    && nullable(current.coverImagePath) === nullable(next.coverImagePath)
    && nullable(current.statusCode) === nullable(next.statusCode)
    && nullable(current.latestEpisodeNo) === nullable(next.latestEpisodeNo)
    && nullable(current.publishedLatestEpisodeNo) === nullable(next.publishedLatestEpisodeNo)
    && nullable(current.syncedLatestEpisodeNo) === nullable(next.syncedLatestEpisodeNo)
    && nullable(current.contextStatus) === nullable(next.contextStatus)
  );
};

export const getStableWebsochatProductSnapshot = <
  T extends WebsochatProductSnapshotComparable,
>(
  current: T | null | undefined,
  next: T,
) => (areWebsochatProductSnapshotsEqual(current, next) && current ? current : next);

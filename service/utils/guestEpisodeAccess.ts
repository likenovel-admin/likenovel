export const GUEST_FREE_EPISODE_LIMIT = 25;

export const isGuestEpisodeLoginRequired = ({
  isAuthenticated,
  episodePriceType,
  episodeNo,
}: {
  isAuthenticated: boolean;
  episodePriceType?: string | null;
  episodeNo?: number | null;
}): boolean =>
  !isAuthenticated &&
  (episodePriceType === "paid" ||
    (episodeNo || 0) > GUEST_FREE_EPISODE_LIMIT);

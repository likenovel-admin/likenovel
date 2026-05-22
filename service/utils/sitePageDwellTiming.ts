const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type SitePageDwellVisibleWindow = {
  startedAt: number;
  visibleStartedAt: number | null;
};

export function resumeSitePageDwellVisibleWindow(
  current: SitePageDwellVisibleWindow,
  now: number
) {
  current.startedAt = now;
  current.visibleStartedAt = now;
}

export function getNextKstMidnightDelayMs(nowMs: number) {
  const kstNowMs = nowMs + KST_OFFSET_MS;
  const nextKstMidnightMs = Math.floor(kstNowMs / DAY_MS) * DAY_MS + DAY_MS;
  return Math.max(nextKstMidnightMs - kstNowMs, 1000);
}

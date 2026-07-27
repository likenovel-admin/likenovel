import { getSiteAnalyticsAccessToken } from "./siteAnalyticsIdentity.ts";

export type ReaderFunnelLane = "guest" | "member";
export type ReaderFunnelEventType =
  | "episode_start"
  | "episode_exit"
  | "episode_complete"
  | "next_episode_click"
  | "product_detail_exit";
export type ReaderFunnelDestinationGroup =
  | "home"
  | "search"
  | "other_product"
  | "other_route"
  | "unknown";

export interface ReaderFunnelEventPayload {
  eventId: string;
  occurredAt: string;
  visitorId: string;
  browserSessionId: string;
  viewerSessionId?: string;
  productId: number;
  episodeId?: number;
  eventType: ReaderFunnelEventType;
  activeMs?: number;
  progressRatio?: number;
  nextEpisodeId?: number;
  destinationGroup?: ReaderFunnelDestinationGroup;
}

export interface ReaderFunnelViewerSession {
  episodeId: number;
  viewerSessionId: string;
  lane: ReaderFunnelLane;
  visitorId: string;
  browserSessionId: string;
}

export interface ReaderFunnelActiveTiming {
  accumulatedMs: number;
  visibleStartedAt: number | null;
}

const viewerSessions = new Map<number, ReaderFunnelViewerSession>();

export const resolveReaderFunnelLane = (
  isAuthenticated: boolean
): ReaderFunnelLane => (isAuthenticated ? "member" : "guest");

export const isReaderFunnelEpisodeComplete = (progressPercent: number) =>
  Number.isFinite(progressPercent) && progressPercent >= 95;

export const getReaderFunnelDestinationGroup = (input: {
  destinationPath?: string | null;
  destinationPageType?: "product_detail" | "viewer" | "other";
  sourceProductId: number;
  destinationProductId?: number;
}): ReaderFunnelDestinationGroup => {
  if (!input.destinationPath) return "unknown";
  if (input.destinationPath === "/") return "home";
  if (input.destinationPath.startsWith("/product/search")) return "search";
  if (
    (input.destinationPageType === "product_detail" ||
      input.destinationPageType === "viewer") &&
    input.destinationProductId != null &&
    input.destinationProductId !== input.sourceProductId
  ) {
    return "other_product";
  }
  if (
    (input.destinationPageType === "product_detail" ||
      input.destinationPageType === "viewer") &&
    input.destinationProductId == null
  ) {
    return "unknown";
  }
  return "other_route";
};

export const registerReaderFunnelViewerSession = (
  session: ReaderFunnelViewerSession
) => {
  viewerSessions.set(session.episodeId, session);
};

export const getReaderFunnelViewerSession = (episodeId: number) =>
  viewerSessions.get(episodeId) ?? null;

export const clearReaderFunnelViewerSession = (
  episodeId: number,
  viewerSessionId: string
) => {
  const current = viewerSessions.get(episodeId);
  if (current?.viewerSessionId === viewerSessionId) {
    viewerSessions.delete(episodeId);
  }
};

export const pauseReaderFunnelActiveWindow = (
  timing: ReaderFunnelActiveTiming,
  now: number
) => {
  if (timing.visibleStartedAt == null) return;
  timing.accumulatedMs += Math.max(0, now - timing.visibleStartedAt);
  timing.visibleStartedAt = null;
};

export const resumeReaderFunnelActiveWindow = (
  timing: ReaderFunnelActiveTiming,
  now: number
) => {
  if (timing.visibleStartedAt == null) {
    timing.visibleStartedAt = now;
  }
};

export const getReaderFunnelActiveMs = (
  timing: ReaderFunnelActiveTiming,
  now: number
) =>
  Math.max(
    0,
    Math.round(
      timing.accumulatedMs +
        (timing.visibleStartedAt == null ? 0 : now - timing.visibleStartedAt)
    )
  );

export const postReaderFunnelEventBestEffort = (
  payload: ReaderFunnelEventPayload
) => {
  try {
    const accessToken = getSiteAnalyticsAccessToken();
    void fetch("/api/v1/command/statistics/reader-funnel-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "include",
    }).catch(() => {
      // Funnel logging must never block the reader flow.
    });
  } catch {
    // Funnel logging must never block the reader flow.
  }
};

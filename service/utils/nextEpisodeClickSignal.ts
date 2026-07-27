import type { IPostAiSignalEventBody } from "@/app/api/query/recommendation/dto";
import { createSiteAnalyticsEventId } from "./siteAnalyticsIdentity.ts";

interface NextEpisodeReaderSession {
  viewerSessionId: string;
  lane: "guest" | "member";
  visitorId: string;
  browserSessionId: string;
}

interface GuestNextEpisodeClickPayload {
  eventId: string;
  occurredAt: string;
  visitorId: string;
  browserSessionId: string;
  viewerSessionId: string;
  productId: number;
  episodeId: number;
  eventType: "next_episode_click";
  activeMs: number;
  progressRatio: number;
  nextEpisodeId: number;
}

export interface NextEpisodeClickSignalContext {
  originAction: "next_episode_click";
  productId: number;
  fromEpisodeId: number;
  redirectToEpisodeId: number;
  entrySource?: string | null;
}

const GUEST_CLICK_DEDUPE_MS = 700;
const guestClickEvents = new Map<string, number>();

const buildGuestClickKey = (context: NextEpisodeClickSignalContext) =>
  [
    context.productId,
    context.fromEpisodeId,
    context.redirectToEpisodeId,
  ].join(":");

export const postGuestNextEpisodeClickSignalBestEffort = (
  context: NextEpisodeClickSignalContext | null | undefined,
  viewerSession: NextEpisodeReaderSession | null | undefined,
  postReaderFunnelEvent: (payload: GuestNextEpisodeClickPayload) => void
) => {
  if (!context) return;

  if (!viewerSession || viewerSession.lane !== "guest") return;

  const now = Date.now();
  const clickKey = buildGuestClickKey(context);
  const previousSentAt = guestClickEvents.get(clickKey);
  if (
    previousSentAt !== undefined &&
    now - previousSentAt < GUEST_CLICK_DEDUPE_MS
  ) {
    return;
  }

  const eventId = createSiteAnalyticsEventId();
  guestClickEvents.set(clickKey, now);
  postReaderFunnelEvent({
    eventId,
    occurredAt: new Date(now).toISOString(),
    visitorId: viewerSession.visitorId,
    browserSessionId: viewerSession.browserSessionId,
    viewerSessionId: viewerSession.viewerSessionId,
    productId: context.productId,
    episodeId: context.fromEpisodeId,
    eventType: "next_episode_click",
    activeMs: 0,
    progressRatio: 0,
    nextEpisodeId: context.redirectToEpisodeId,
  });
};

export const postNextEpisodeClickSignalBestEffort = (
  context: NextEpisodeClickSignalContext | null | undefined,
  viewerSession?: NextEpisodeReaderSession | null,
  postReaderFunnelEvent?: (payload: GuestNextEpisodeClickPayload) => void
) => {
  if (!context) return;

  if (viewerSession?.lane === "guest") {
    if (postReaderFunnelEvent) {
      postGuestNextEpisodeClickSignalBestEffort(
        context,
        viewerSession,
        postReaderFunnelEvent
      );
    }
    return;
  }

  const accessToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (!accessToken) return;

  const eventPayload: Record<string, string | number> = {
    redirect_to_episode_id: context.redirectToEpisodeId,
  };
  const entrySource = context.entrySource?.trim();
  if (entrySource) {
    eventPayload.entry_source = entrySource;
  }

  const body: IPostAiSignalEventBody = {
    product_id: context.productId,
    episode_id: context.fromEpisodeId,
    event_type: "next_episode_click",
    next_available_yn: "Y",
    event_payload: eventPayload,
  };

  void fetch("/api/v1/command/ai/signal-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    keepalive: true,
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        console.error("[aiSignal] next_episode_click failed", {
          status: response.status,
          fromEpisodeId: context.fromEpisodeId,
          redirectToEpisodeId: context.redirectToEpisodeId,
        });
      }
    })
    .catch((error) => {
      console.error("[aiSignal] next_episode_click request error", error);
    });
};

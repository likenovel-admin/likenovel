interface WebsochatStartSurfaceState {
  isPreparingNewSession: boolean;
  actorReady: boolean;
  sessionsReady: boolean;
  sessionsFailed?: boolean;
  sessionCount: number;
  activeSessionId: number | null;
  selectedProductId: number | null;
  hasSelectedProductSnapshot: boolean;
  hasPendingWebsochatLaunch: boolean;
  hasPendingCharacterLaunch: boolean;
  isCreatingCharacterSession: boolean;
  hasPendingSessionPreview: boolean;
}

export type WebsochatStartSurfaceResolution =
  | "chooser"
  | "loading"
  | "error"
  | "content";

export const resolveWebsochatStartSurface = ({
  isPreparingNewSession,
  actorReady,
  sessionsReady,
  sessionsFailed = false,
  sessionCount,
  activeSessionId,
  selectedProductId,
  hasSelectedProductSnapshot,
  hasPendingWebsochatLaunch,
  hasPendingCharacterLaunch,
  isCreatingCharacterSession,
  hasPendingSessionPreview,
}: WebsochatStartSurfaceState): WebsochatStartSurfaceResolution => {
  const hasConversationContext = Boolean(
    activeSessionId
    || selectedProductId
    || hasSelectedProductSnapshot
    || hasPendingWebsochatLaunch
    || hasPendingCharacterLaunch
    || isCreatingCharacterSession
    || hasPendingSessionPreview
  );
  if (hasConversationContext) return "content";
  if (isPreparingNewSession) return "chooser";
  if (sessionsFailed) return "error";
  if (!actorReady || !sessionsReady) return "loading";
  if (sessionCount > 0) return "loading";
  return "chooser";
};

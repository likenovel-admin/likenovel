const PENDING_WEBSOCHAT_LAUNCH_KEY = "pending_websochat_launch";
const PENDING_WEBSOCHAT_LAUNCH_TTL_MS = 60 * 1000;

export type WebsochatLaunchModeKey = "qa" | "rp" | "ideal_worldcup";
export type WebsochatLaunchQaActionKey = "predict" | "next_episode_write" | null;

export interface IWebsochatLaunchPayload {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  latestEpisodeNo?: number | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
  readEpisodeNo?: number | null;
  readEpisodeTitle?: string | null;
  launchSource?: string | null;
  action: {
    label: string;
    prompt: string;
    modeKey?: WebsochatLaunchModeKey | null;
    qaActionKey?: WebsochatLaunchQaActionKey;
  };
  createdAt: number;
}

export const savePendingWebsochatLaunch = (
  payload: Omit<IWebsochatLaunchPayload, "createdAt">
) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    PENDING_WEBSOCHAT_LAUNCH_KEY,
    JSON.stringify({
      ...payload,
      createdAt: Date.now(),
    } satisfies IWebsochatLaunchPayload)
  );
};

export const consumePendingWebsochatLaunch =
  (): IWebsochatLaunchPayload | null => {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(PENDING_WEBSOCHAT_LAUNCH_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<IWebsochatLaunchPayload>;
      sessionStorage.removeItem(PENDING_WEBSOCHAT_LAUNCH_KEY);

      if (
        !parsed.productId ||
        !parsed.title ||
        !parsed.action?.label ||
        !parsed.action?.prompt ||
        typeof parsed.createdAt !== "number"
      ) {
        return null;
      }

      if (Date.now() - parsed.createdAt > PENDING_WEBSOCHAT_LAUNCH_TTL_MS) {
        return null;
      }

      return {
        productId: parsed.productId,
        title: parsed.title,
        authorNickname: parsed.authorNickname || null,
        coverImagePath: parsed.coverImagePath || null,
        latestEpisodeNo: parsed.latestEpisodeNo || 0,
        publishedLatestEpisodeNo:
          typeof parsed.publishedLatestEpisodeNo === "number"
            ? parsed.publishedLatestEpisodeNo
            : (parsed.latestEpisodeNo || 0),
        syncedLatestEpisodeNo:
          typeof parsed.syncedLatestEpisodeNo === "number"
            ? parsed.syncedLatestEpisodeNo
            : null,
        contextStatus: parsed.contextStatus || "ready",
        readEpisodeNo:
          typeof parsed.readEpisodeNo === "number" ? parsed.readEpisodeNo : null,
        readEpisodeTitle: parsed.readEpisodeTitle || null,
        launchSource: parsed.launchSource || null,
        action: {
          label: parsed.action.label,
          prompt: parsed.action.prompt,
          modeKey: parsed.action.modeKey || "qa",
          qaActionKey: parsed.action.qaActionKey || null,
        },
        createdAt: parsed.createdAt,
      };
    } catch (error) {
      console.error("[websochatLaunch] failed to consume pending launch", error);
      sessionStorage.removeItem(PENDING_WEBSOCHAT_LAUNCH_KEY);
      return null;
    }
  };

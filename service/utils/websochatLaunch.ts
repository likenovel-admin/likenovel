const PENDING_WEBSOCHAT_LAUNCH_KEY = "pending_websochat_launch";
const PENDING_WEBSOCHAT_LAUNCH_TTL_MS = 60 * 1000;
const WEBSOCHAT_RETURN_PATH_STORAGE_KEY = "websochat_return_path";
export const WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY = "websochat_active_session_id";
export const WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY =
  "websochat_session_shortcut_prompts";
const WEBSOCHAT_SESSION_PENDING_DRAFTS_STORAGE_KEY =
  "websochat_session_pending_drafts";
const WEBSOCHAT_GUEST_KEY_STORAGE_KEY = "story_agent_guest_key";
const WEBSOCHAT_MINI_PREVIEW_STATE_STORAGE_KEY =
  "websochat_mini_preview_state";

type WebsochatReturnPathStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const getWebsochatReturnPathStorage = () =>
  typeof window === "undefined" ? undefined : window.sessionStorage;

const normalizeWebsochatReturnPath = (path: string | null | undefined) => {
  const normalized = String(path || "").trim();
  if (
    !normalized.startsWith("/")
    || normalized.startsWith("//")
    || normalized.includes("\\")
  ) {
    return null;
  }

  const pathname = normalized.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return pathname === "/websochat" ? null : normalized;
};

export const saveWebsochatReturnPath = ({
  path = typeof window === "undefined"
    ? ""
    : `${window.location.pathname}${window.location.search}${window.location.hash}`,
  storage = getWebsochatReturnPathStorage(),
}: {
  path?: string;
  storage?: WebsochatReturnPathStorage;
} = {}) => {
  if (!storage) return;
  const normalized = normalizeWebsochatReturnPath(path);
  if (!normalized) return;
  storage.setItem(WEBSOCHAT_RETURN_PATH_STORAGE_KEY, normalized);
};

export const consumeWebsochatReturnPath = ({
  storage = getWebsochatReturnPathStorage(),
}: {
  storage?: WebsochatReturnPathStorage;
} = {}) => {
  if (!storage) return null;
  const storedPath = storage.getItem(WEBSOCHAT_RETURN_PATH_STORAGE_KEY);
  storage.removeItem(WEBSOCHAT_RETURN_PATH_STORAGE_KEY);
  return normalizeWebsochatReturnPath(storedPath);
};

export const resolveWebsochatSessionListTitle = ({
  sessionKind,
  title,
  characterDisplayName,
}: {
  sessionKind?: "websochat" | "character_chat";
  title: string;
  characterDisplayName?: string | null;
}) => {
  if (sessionKind !== "character_chat") return title;

  return String(characterDisplayName || "").trim()
    || title.replace(/\s*(?:과|와)의\s*대화\s*$/, "").trim()
    || "주인공";
};

export type WebsochatLaunchModeKey = "qa" | "rp" | "ideal_worldcup";
export type WebsochatLaunchQaActionKey = "predict" | "next_episode_write" | null;

export const resolveWebsochatActorKey = ({
  isAuthInitialized,
  canUseAccountScope,
  userId,
  guestKey,
}: {
  isAuthInitialized: boolean;
  canUseAccountScope: boolean;
  userId?: number | string | null;
  guestKey?: string | null;
}) => {
  if (!isAuthInitialized) return "";
  if (!canUseAccountScope) return String(guestKey || "").trim();

  const normalizedUserId = String(userId ?? "").trim();
  return normalizedUserId ? `user:${normalizedUserId}` : "";
};

type WebsochatActiveSessionResolution =
  | { action: "wait" }
  | { action: "keep" }
  | { action: "clear" }
  | { action: "select"; sessionId: number };

export const resolveWebsochatActiveSession = ({
  actorReady,
  sessionsReady,
  activeSessionId,
  storedSessionId,
  sessionIds,
  hasDraftComposerContext,
  pendingSessionId,
}: {
  actorReady: boolean;
  sessionsReady: boolean;
  activeSessionId: number | null;
  storedSessionId: number | null;
  sessionIds: number[];
  hasDraftComposerContext: boolean;
  pendingSessionId: number | null;
}): WebsochatActiveSessionResolution => {
  if (!actorReady || !sessionsReady) return { action: "wait" };

  if (!sessionIds.length) {
    return pendingSessionId ? { action: "keep" } : { action: "clear" };
  }

  if (pendingSessionId) {
    return { action: "keep" };
  }

  if (!activeSessionId) {
    if (hasDraftComposerContext) return { action: "keep" };
    const restoredSessionId = storedSessionId && sessionIds.includes(storedSessionId)
      ? storedSessionId
      : sessionIds[0];
    return { action: "select", sessionId: restoredSessionId };
  }

  if (sessionIds.includes(activeSessionId)) return { action: "keep" };
  return { action: "select", sessionId: sessionIds[0] };
};

export const shouldShowWebsochatStickyGuide = ({
  activeSessionId,
  effectiveProductId,
  guideSessionId,
  guideProductId,
  isHomeCharacterLaunchPending,
}: {
  activeSessionId: number | null;
  effectiveProductId: number | null;
  guideSessionId: number | null;
  guideProductId: number | null;
  isHomeCharacterLaunchPending: boolean;
}) => {
  if (isHomeCharacterLaunchPending) return false;
  if (activeSessionId) return guideSessionId === activeSessionId;
  return guideSessionId == null
    && (guideProductId == null || guideProductId === effectiveProductId);
};

export const isWebsochatModeAllowed = (
  modeKey: WebsochatLaunchModeKey,
  allowedModes?: WebsochatLaunchModeKey[] | null
) => allowedModes == null || allowedModes.includes(modeKey);

export const filterWebsochatActionsByAllowedModes = <
  T extends { modeKey?: WebsochatLaunchModeKey | null },
>(
  actions: T[],
  allowedModes?: WebsochatLaunchModeKey[] | null
) => {
  if (allowedModes == null) return actions;
  return actions.filter((action) => (
    isWebsochatModeAllowed(action.modeKey || "qa", allowedModes)
  ));
};

export const isVisibleWebsochatComposerShortcutAction = (
  action: { modeKey?: WebsochatLaunchModeKey | null }
) => (action.modeKey || "qa") !== "rp";

export const isVisibleWebsochatPublicShortcutAction = (
  action: { modeKey?: WebsochatLaunchModeKey | null }
) => (action.modeKey || "qa") !== "rp";

export interface IWebsochatLaunchPayload {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  priceType?: string | null;
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

export interface IWebsochatLaunchProductSource {
  productId?: number | null;
  title?: string | null;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  priceType?: string | null;
  isPaidProduct?: boolean | null;
  latestEpisodeNo?: number | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
}

export interface IWebsochatLaunchEligibility {
  canLaunch: boolean;
  displayState: "ready" | "unavailable" | "hidden";
  unavailableMessage: string;
  publishedLatestEpisodeNo: number;
  syncedLatestEpisodeNo: number;
}

export interface IWebsochatStarterGuideSource {
  productTitle?: string | null;
  scopeState?: string | null;
  readEpisodeNo?: number | null;
  readEpisodeTitle?: string | null;
}

export interface IWebsochatMiniPreviewState {
  completedSendCount: number;
  dayKey: string;
  updatedAt: number;
}

const normalizeWebsochatEpisodeNo = (value?: number | null) =>
  Math.max(Number(value || 0), 0);

const formatWebsochatProductTitle = (productTitle?: string | null) => {
  const normalizedTitle = String(productTitle || "").trim();
  return normalizedTitle ? `<${normalizedTitle}>` : "";
};

export const formatWebsochatReadScope = (
  episodeNo?: number | null,
  episodeTitle?: string | null
) => {
  if (!episodeNo || episodeNo <= 0) return "";
  const normalizedTitle = String(episodeTitle || "").trim();
  return normalizedTitle
    ? `${episodeNo}화(${normalizedTitle})`
    : `${episodeNo}화`;
};

export const buildWebsochatStarterGuideMessage = (
  source: IWebsochatStarterGuideSource
) => {
  const productTitle = formatWebsochatProductTitle(source.productTitle);
  const readScopeText = formatWebsochatReadScope(
    source.readEpisodeNo,
    source.readEpisodeTitle
  );

  if (productTitle && source.scopeState === "known" && readScopeText) {
    return `${productTitle} 이야기, ${readScopeText}까지 읽은 기준으로 편하게 이어가볼게요. 기억에 남은 장면이나 궁금한 인물, 다음 전개 같은 거 아무거나 말해 주세요.`;
  }

  if (productTitle && source.scopeState === "none") {
    return `${productTitle}로 같이 시작해볼게요. 아직 읽기 전이어도 괜찮아요. 어디까지 봤는지 알려주면 그 범위에 맞춰서 더 자연스럽게 이야기해드릴게요.`;
  }

  if (productTitle) {
    return `${productTitle}로 이야기 시작해볼게요. 몇 화까지 봤는지만 알려주면 그 기준에 맞춰서 스포일러 없이 더 자연스럽게 이어갈게요.`;
  }

  return "먼저 작품만 골라주면 바로 같이 이야기 시작할게요. 작품 대화든 인물과 대화든, 원하는 방식으로 편하게 이어가면 돼요.";
};

export const buildWebsochatIdleGuideMessage = (
  productTitle?: string | null
) => {
  const displayTitle = formatWebsochatProductTitle(productTitle);
  if (displayTitle) {
    return `${displayTitle} 이야기로 바로 시작할게요. 마음에 남은 장면, 궁금한 인물, 다음 전개처럼 떠오르는 것부터 편하게 말해 주세요.`;
  }

  return "먼저 작품만 골라주면 바로 같이 이야기 시작할게요. 작품 대화든 인물과 대화든, 원하는 방식으로 편하게 이어가면 돼요.";
};

const getWebsochatLocalDayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readWebsochatMiniPreviewStateMap = () => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(
      WEBSOCHAT_MINI_PREVIEW_STATE_STORAGE_KEY
    );
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, IWebsochatMiniPreviewState>)
      : {};
  } catch (error) {
    console.error("[websochatLaunch] failed to read mini preview state", error);
    return {};
  }
};

const writeWebsochatMiniPreviewStateMap = (
  stateMap: Record<string, IWebsochatMiniPreviewState>
) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      WEBSOCHAT_MINI_PREVIEW_STATE_STORAGE_KEY,
      JSON.stringify(stateMap)
    );
  } catch (error) {
    console.error("[websochatLaunch] failed to write mini preview state", error);
  }
};

export const buildWebsochatMiniPreviewStateKey = ({
  productId,
  userId,
  guestKey,
}: {
  productId: number;
  userId?: number | string | null;
  guestKey?: string | null;
}) => {
  const actorKey = userId
    ? `user:${userId}`
    : guestKey
      ? `guest:${guestKey}`
      : "guest:anonymous";
  return `product:${productId}:${actorKey}`;
};

export const readWebsochatMiniPreviewState = (
  stateKey: string
): IWebsochatMiniPreviewState | null => {
  if (!stateKey) return null;
  const state = readWebsochatMiniPreviewStateMap()[stateKey];
  if (!state || state.dayKey !== getWebsochatLocalDayKey()) return null;
  return {
    completedSendCount: Math.max(Number(state.completedSendCount || 0), 0),
    dayKey: state.dayKey,
    updatedAt: Number(state.updatedAt || 0),
  };
};

export const saveWebsochatMiniPreviewState = (
  stateKey: string,
  state: Pick<IWebsochatMiniPreviewState, "completedSendCount">
) => {
  if (!stateKey) return;
  const stateMap = readWebsochatMiniPreviewStateMap();
  stateMap[stateKey] = {
    completedSendCount: Math.max(Number(state.completedSendCount || 0), 0),
    dayKey: getWebsochatLocalDayKey(),
    updatedAt: Date.now(),
  };
  writeWebsochatMiniPreviewStateMap(stateMap);
};

export const getWebsochatLaunchEligibility = (
  source: IWebsochatLaunchProductSource
): IWebsochatLaunchEligibility => {
  const publishedLatestEpisodeNo = normalizeWebsochatEpisodeNo(
    source.publishedLatestEpisodeNo ?? source.latestEpisodeNo
  );
  const syncedLatestEpisodeNo = normalizeWebsochatEpisodeNo(
    source.syncedLatestEpisodeNo
  );
  const hasProductIdentity = !!source.productId && !!source.title;
  const canLaunch =
    source.contextStatus === "ready" &&
    hasProductIdentity &&
    publishedLatestEpisodeNo > 0 &&
    syncedLatestEpisodeNo > 0;

  return {
    canLaunch,
    displayState: canLaunch
      ? "ready"
      : hasProductIdentity
        ? "unavailable"
        : "hidden",
    unavailableMessage: "현재 웹소챗을 지원하지 않는 작품입니다.",
    publishedLatestEpisodeNo,
    syncedLatestEpisodeNo,
  };
};

export const buildWebsochatLaunchPayload = (
  source: IWebsochatLaunchProductSource,
  action: IWebsochatLaunchPayload["action"],
  launchSource?: string | null
): Omit<IWebsochatLaunchPayload, "createdAt"> | null => {
  const eligibility = getWebsochatLaunchEligibility(source);
  if (!eligibility.canLaunch || !source.productId || !source.title) return null;

  return {
    productId: source.productId,
    title: source.title,
    authorNickname: source.authorNickname || null,
    coverImagePath: source.coverImagePath || null,
    priceType:
      source.priceType === "paid"
        ? "paid"
        : source.priceType === "free"
          ? "free"
          : null,
    latestEpisodeNo: eligibility.publishedLatestEpisodeNo,
    publishedLatestEpisodeNo: eligibility.publishedLatestEpisodeNo,
    syncedLatestEpisodeNo: eligibility.syncedLatestEpisodeNo,
    contextStatus: source.contextStatus || null,
    launchSource: launchSource || null,
    action,
  };
};

export const savePendingWebsochatLaunch = (
  payload: Omit<IWebsochatLaunchPayload, "createdAt">
) => {
  if (typeof window === "undefined") return;

  saveWebsochatReturnPath();
  sessionStorage.setItem(
    PENDING_WEBSOCHAT_LAUNCH_KEY,
    JSON.stringify({
      ...payload,
      createdAt: Date.now(),
    } satisfies IWebsochatLaunchPayload)
  );
};

export const getOrCreateWebsochatGuestKey = () => {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(WEBSOCHAT_GUEST_KEY_STORAGE_KEY);
  if (existing) return existing;
  const nextKey = window.crypto.randomUUID();
  window.localStorage.setItem(WEBSOCHAT_GUEST_KEY_STORAGE_KEY, nextKey);
  return nextKey;
};

export const saveActiveWebsochatSessionId = (sessionId: number | null) => {
  if (typeof window === "undefined") return;
  if (sessionId && sessionId > 0) {
    window.sessionStorage.setItem(
      WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY,
      String(sessionId)
    );
    return;
  }
  window.sessionStorage.removeItem(WEBSOCHAT_ACTIVE_SESSION_STORAGE_KEY);
};

const readWebsochatSessionTextMap = (storageKey: string) => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.entries(parsed).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        const normalizedKey = String(key || "").trim();
        if (normalizedKey) {
          acc[normalizedKey] = String(value || "").trim();
        }
        return acc;
      },
      {}
    );
  } catch {
    return {};
  }
};

const writeWebsochatSessionTextMap = (
  storageKey: string,
  stored: Record<string, string>
) => {
  if (typeof window === "undefined") return;
  const entries = Object.entries(stored).filter(
    ([key, value]) => String(key || "").trim() && String(value || "").trim()
  );
  if (!entries.length) {
    window.sessionStorage.removeItem(storageKey);
    return;
  }
  window.sessionStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(entries)));
};

const saveWebsochatSessionText = (
  storageKey: string,
  sessionId: number,
  text: string
) => {
  if (typeof window === "undefined" || !sessionId) return;
  const normalizedText = String(text || "").trim();
  if (!normalizedText) return;
  const stored = readWebsochatSessionTextMap(storageKey);
  stored[String(sessionId)] = normalizedText;
  writeWebsochatSessionTextMap(storageKey, stored);
};

export const saveWebsochatSessionShortcutPrompt = (
  sessionId: number,
  prompt: string
) => {
  saveWebsochatSessionText(
    WEBSOCHAT_SESSION_SHORTCUT_PROMPTS_STORAGE_KEY,
    sessionId,
    prompt
  );
};

export const saveWebsochatSessionPendingDraft = (
  sessionId: number,
  draft: string
) => {
  saveWebsochatSessionText(
    WEBSOCHAT_SESSION_PENDING_DRAFTS_STORAGE_KEY,
    sessionId,
    draft
  );
};

export const consumeWebsochatSessionPendingDraft = (sessionId: number | null) => {
  if (typeof window === "undefined" || !sessionId) return "";
  const stored = readWebsochatSessionTextMap(
    WEBSOCHAT_SESSION_PENDING_DRAFTS_STORAGE_KEY
  );
  const key = String(sessionId);
  const draft = stored[key] || "";
  if (key in stored) {
    delete stored[key];
    writeWebsochatSessionTextMap(
      WEBSOCHAT_SESSION_PENDING_DRAFTS_STORAGE_KEY,
      stored
    );
  }
  return draft;
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
        priceType:
          parsed.priceType === "paid"
            ? "paid"
            : parsed.priceType === "free"
              ? "free"
              : null,
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

const PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY =
  "pending_home_character_chat_launch";
const PENDING_HOME_CHARACTER_CHAT_LAUNCH_TTL_MS = 60 * 1000;

export interface PendingHomeCharacterChatLaunch {
  productId: number;
  productTitle: string;
  characterScopeKey: string;
  characterName: string;
  adultYn: "Y" | "N";
  createdAt: number;
}

export interface HomeCharacterChatSessionRequest {
  product_id: number;
  guest_key?: string;
  title: string;
  session_kind: "character_chat";
  entry_source: "home_character_slot";
  locked_character_scope_key: string;
  rp_mode: "free";
  adult_yn: "Y" | "N";
  account_read_episode_to?: number;
}

export const buildHomeCharacterWarmupMessages = ({
  productTitle,
  readEpisodeNo,
}: {
  productTitle: string;
  readEpisodeNo?: number | null;
}) => {
  const normalizedTitle = String(productTitle || "").trim();
  const title = normalizedTitle ? `〈${normalizedTitle}〉` : "작품";
  const readScopeMessage = readEpisodeNo && readEpisodeNo > 0
    ? `${title}을 ${readEpisodeNo}화까지 읽은 기록을 반영하고 있어요.`
    : `${title}의 읽은 범위를 확인하고 있어요.`;

  return [
    readScopeMessage,
    "캐릭터를 소환하고 있어요.",
    "캐릭터가 무대에 오를 준비를 하고 있어요.",
    "캐릭터가 지금까지의 스토리 맥락을 읽고 있어요.",
  ];
};

export const savePendingHomeCharacterChatLaunch = (
  payload: Omit<PendingHomeCharacterChatLaunch, "createdAt">
) => {
  if (typeof window === "undefined") {
    throw new Error("브라우저에서만 캐릭터 대화를 시작할 수 있습니다.");
  }
  window.sessionStorage.setItem(
    PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY,
    JSON.stringify({ ...payload, createdAt: Date.now() })
  );
};

export const consumePendingHomeCharacterChatLaunch = () => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(
    PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY
  );
  window.sessionStorage.removeItem(PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingHomeCharacterChatLaunch>;
    const productId = Number(parsed.productId || 0);
    const productTitle = String(parsed.productTitle || "").trim();
    const characterScopeKey = String(parsed.characterScopeKey || "").trim();
    const characterName = String(parsed.characterName || "").trim();
    const createdAt = Number(parsed.createdAt || 0);
    if (
      !Number.isInteger(productId)
      || productId <= 0
      || !productTitle
      || !characterScopeKey
      || !characterName
      || !createdAt
      || Date.now() - createdAt > PENDING_HOME_CHARACTER_CHAT_LAUNCH_TTL_MS
      || (parsed.adultYn !== "Y" && parsed.adultYn !== "N")
    ) {
      return null;
    }
    return {
      productId,
      productTitle,
      characterScopeKey,
      characterName,
      adultYn: parsed.adultYn,
      createdAt,
    } satisfies PendingHomeCharacterChatLaunch;
  } catch {
    return null;
  }
};

interface BuildHomeCharacterChatRequestParams {
  productId: number;
  characterScopeKey: string;
  characterName: string;
  adultYn: "Y" | "N";
  guestKey?: string | null;
  accountReadEpisodeTo?: number | null;
}

export const buildHomeCharacterChatSessionRequest = ({
  productId,
  characterScopeKey,
  characterName,
  adultYn,
  guestKey,
  accountReadEpisodeTo,
}: BuildHomeCharacterChatRequestParams): HomeCharacterChatSessionRequest => ({
  product_id: productId,
  ...(guestKey ? { guest_key: guestKey } : {}),
  title: `${characterName}과의 대화`,
  session_kind: "character_chat",
  entry_source: "home_character_slot",
  locked_character_scope_key: characterScopeKey,
  rp_mode: "free",
  adult_yn: adultYn,
  ...(accountReadEpisodeTo && accountReadEpisodeTo > 0
    ? { account_read_episode_to: accountReadEpisodeTo }
    : {}),
});

interface LaunchHomeCharacterChatParams {
  request: HomeCharacterChatSessionRequest;
  createSession: (
    request: HomeCharacterChatSessionRequest
  ) => Promise<{ data?: { sessionId?: number | null } }>;
  saveSessionId: (sessionId: number) => void;
  clearSessionListCache: () => void;
  navigate: () => void;
}

export const launchHomeCharacterChat = async ({
  request,
  createSession,
  saveSessionId,
  clearSessionListCache,
  navigate,
}: LaunchHomeCharacterChatParams) => {
  const response = await createSession(request);
  const sessionId = Number(response.data?.sessionId || 0);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new Error("캐릭터 대화 세션을 만들지 못했습니다.");
  }
  saveSessionId(sessionId);
  clearSessionListCache();
  navigate();
  return sessionId;
};

export const createSingleFlightRunner = () => {
  let inFlight = false;

  return async <T>(task: () => Promise<T>): Promise<T | null> => {
    if (inFlight) return null;
    inFlight = true;
    try {
      return await task();
    } finally {
      inFlight = false;
    }
  };
};

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

export interface PendingHomeCharacterChatLaunch {
  request: HomeCharacterChatSessionRequest;
  characterName: string;
  characterImagePath: string | null;
  productTitle: string;
  authorNickname: string | null;
  createdAt: number;
}

interface RecoverableHomeCharacterChatSession {
  sessionId: number;
  productId: number;
  sessionKind?: string | null;
  entrySource?: string | null;
  lockedCharacterScopeKey?: string | null;
  createdDate?: string | null;
}

const MYSQL_LOCAL_DATETIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/;

const parseHomeCharacterChatSessionCreatedAt = (value?: string | null) => {
  const normalized = String(value || "").trim();
  const mysqlMatch = normalized.match(MYSQL_LOCAL_DATETIME_PATTERN);
  return Date.parse(
    mysqlMatch
      ? `${mysqlMatch[1]}T${mysqlMatch[2]}+09:00`
      : normalized
  );
};

type PendingHomeCharacterChatLaunchInput = Omit<
  PendingHomeCharacterChatLaunch,
  "createdAt"
>;

type CharacterChatStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY =
  "pending_home_character_chat_launch";
const PENDING_HOME_CHARACTER_CHAT_LAUNCH_TTL_MS = 60_000;

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

interface QueueHomeCharacterChatLaunchParams {
  payload: PendingHomeCharacterChatLaunchInput;
  storage?: CharacterChatStorage;
  now?: number;
  clearActiveSession: () => void;
  clearSessionListCache: () => void;
  navigate: () => void;
}

const getCharacterChatSessionStorage = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

export const savePendingHomeCharacterChatLaunch = ({
  payload,
  storage = getCharacterChatSessionStorage() ?? undefined,
  now = Date.now(),
}: {
  payload: PendingHomeCharacterChatLaunchInput;
  storage?: CharacterChatStorage;
  now?: number;
}) => {
  if (!storage) return;
  storage.setItem(
    PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY,
    JSON.stringify({ ...payload, createdAt: now } satisfies PendingHomeCharacterChatLaunch)
  );
};

export const consumePendingHomeCharacterChatLaunch = ({
  storage = getCharacterChatSessionStorage() ?? undefined,
  now = Date.now(),
}: {
  storage?: CharacterChatStorage;
  now?: number;
} = {}): PendingHomeCharacterChatLaunch | null => {
  if (!storage) return null;

  const raw = storage.getItem(PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY);
  storage.removeItem(PENDING_HOME_CHARACTER_CHAT_LAUNCH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingHomeCharacterChatLaunch>;
    const request = parsed.request;
    const createdAt = Number(parsed.createdAt || 0);
    const isExpired =
      !createdAt
      || createdAt > now + 5_000
      || now - createdAt > PENDING_HOME_CHARACTER_CHAT_LAUNCH_TTL_MS;
    const isValidRequest =
      request?.session_kind === "character_chat"
      && request.entry_source === "home_character_slot"
      && Number.isInteger(Number(request.product_id))
      && Number(request.product_id) > 0
      && Boolean(String(request.locked_character_scope_key || "").trim());
    const characterName = String(parsed.characterName || "").trim();
    const productTitle = String(parsed.productTitle || "").trim();

    if (isExpired || !isValidRequest || !characterName || !productTitle) {
      return null;
    }

    return {
      request: request as HomeCharacterChatSessionRequest,
      characterName,
      characterImagePath: parsed.characterImagePath || null,
      productTitle,
      authorNickname: parsed.authorNickname || null,
      createdAt,
    };
  } catch {
    return null;
  }
};

export const findRecoverableHomeCharacterChatSession = <
  T extends RecoverableHomeCharacterChatSession,
>({
  sessions,
  launch,
  now = Date.now(),
}: {
  sessions: T[];
  launch: PendingHomeCharacterChatLaunch;
  now?: number;
}): T | null => {
  const earliestCreatedAt = launch.createdAt - 5_000;
  const latestCreatedAt = now + 5_000;

  return sessions.find((session) => {
    const createdAt = parseHomeCharacterChatSessionCreatedAt(
      session.createdDate
    );
    return session.sessionKind === "character_chat"
      && session.entrySource === "home_character_slot"
      && session.productId === launch.request.product_id
      && session.lockedCharacterScopeKey
        === launch.request.locked_character_scope_key
      && Number.isFinite(createdAt)
      && createdAt >= earliestCreatedAt
      && createdAt <= latestCreatedAt;
  }) ?? null;
};

export const queueHomeCharacterChatLaunch = ({
  payload,
  storage,
  now,
  clearActiveSession,
  clearSessionListCache,
  navigate,
}: QueueHomeCharacterChatLaunchParams) => {
  savePendingHomeCharacterChatLaunch({ payload, storage, now });
  clearActiveSession();
  clearSessionListCache();
  navigate();
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

export const buildCharacterChatChoiceMessage = ({
  dialogue,
  narration,
}: {
  label: string;
  dialogue: string;
  narration: string;
}) => {
  const normalizedDialogue = String(dialogue || "").trim();
  const normalizedNarration = String(narration || "")
    .trim()
    .replace(/^\*\s*/, "");

  return [
    normalizedDialogue,
    normalizedNarration ? `* ${normalizedNarration}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

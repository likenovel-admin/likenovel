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

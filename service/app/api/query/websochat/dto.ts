export interface IWebsochatProductItem {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  statusCode?: string | null;
  priceType?: "free" | "paid" | null;
  latestEpisodeNo: number;
  publishedLatestEpisodeNo?: number;
  syncedLatestEpisodeNo?: number;
  contextStatus?: string | null;
}

export interface IGetWebsochatProductsResponse {
  data: IWebsochatProductItem[];
}

export interface IGetWebsochatBillingStatusResponse {
  data: {
    freeRemainingMessages: number;
    dailyFreeMessageLimit: number;
    cashCostPerMessage: number;
    requiresCashForNextMessage: boolean;
    requiresLoginForNextMessage: boolean;
    cashBalance: number | null;
  };
}

export interface IWebsochatSessionItem {
  sessionId: number;
  productId: number;
  title: string;
  sessionKind?: "websochat" | "character_chat";
  entrySource?: string | null;
  lockedCharacterScopeKey?: string | null;
  allowedModes?: Array<"qa" | "rp" | "ideal_worldcup">;
  characterDisplayName?: string | null;
  createdDate: string;
  updatedDate: string;
  productTitle?: string | null;
  productAuthorNickname?: string | null;
  coverImagePath?: string | null;
  characterImagePath?: string | null;
  productPriceType?: "free" | "paid" | null;
  readScopeState?: "unknown" | "none" | "known";
  readEpisodeNo?: number | null;
  readEpisodeTitle?: string | null;
  latestEpisodeNo?: number;
  publishedLatestEpisodeNo?: number;
  syncedLatestEpisodeNo?: number;
  contextStatus?: string | null;
  canSendMessage?: boolean;
  unavailableMessage?: string | null;
  pendingQaActionKey?: "predict" | "next_episode_write" | null;
  rpStage?: "idle" | "awaiting_character" | "chatting";
  rpActiveCharacterLabel?: string | null;
}

export interface IGetWebsochatSessionsResponse {
  data: IWebsochatSessionItem[];
}

export interface ICreateWebsochatSessionResponse {
  data: {
    sessionId: number;
    productId: number;
    title: string;
    sessionKind?: "websochat" | "character_chat";
    entrySource?: string | null;
    lockedCharacterScopeKey?: string | null;
    allowedModes?: Array<"qa" | "rp" | "ideal_worldcup">;
    characterDisplayName?: string | null;
    characterImagePath?: string | null;
    product: IWebsochatProductItem;
  };
}

export interface IPatchWebsochatSessionReadScopeResponse {
  data: {
    sessionId: number;
    readScopeState: "known";
    readEpisodeNo: number;
    readEpisodeTitle?: string | null;
  };
}

export interface IPatchWebsochatSessionModeResponse {
  data: {
    sessionId: number;
    modeKey: "qa" | "rp" | "ideal_worldcup";
    pendingRpCharacterSelection: boolean;
  };
}

export interface IWebsochatCharacterChatChoiceItem {
  label: string;
  dialogue: string;
  narration: string;
  intentKind?: "observe" | "ask" | "move" | "interact" | "assist" | "wait";
  targetAnchor?: string;
}

export interface IPostWebsochatCharacterChatChoicesResponse {
  data: {
    choices: IWebsochatCharacterChatChoiceItem[];
    sourceAssistantMessageId: number;
    generationSource: "generated" | "floor" | "none";
  };
}

export interface IWebsochatMessageItem {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  createdDate?: string;
  clientMessageId?: string | null;
  referencedEpisodeNos?: number[] | null;
  reasonCards?: IWebsochatReasonCardItem[] | null;
  actionCards?: IWebsochatStarterActionItem[] | null;
  ctaCards?: IWebsochatCtaCardItem[] | null;
}

export interface IWebsochatStarterActionItem {
  label: string;
  prompt: string;
  modeKey?: "qa" | "rp" | "ideal_worldcup" | null;
  qaActionKey?: "predict" | "next_episode_write" | null;
  cashCost?: number | null;
}

export interface IWebsochatReasonCardItem {
  title: string;
  description: string;
}

export interface IWebsochatCtaCardItem {
  type: "product_detail";
  label: string;
  productId?: number | null;
}

export interface IWebsochatStarterItem {
  productTitle: string;
  scopeState?: "unknown" | "none" | "known";
  readEpisodeNo?: number | null;
  readEpisodeTitle?: string | null;
  latestEpisodeNo?: number;
  publishedLatestEpisodeNo?: number;
  syncedLatestEpisodeNo?: number;
  reasonCards?: IWebsochatReasonCardItem[];
  ctaCards?: IWebsochatCtaCardItem[];
  actions: IWebsochatStarterActionItem[];
}

export interface IGetWebsochatMessagesResponse {
  data: {
    session: IWebsochatSessionItem;
    messages: IWebsochatMessageItem[];
    starter?: IWebsochatStarterItem | null;
    guideMessage?: IWebsochatMessageItem | null;
  };
}

export interface IPostWebsochatMessageResponse {
  data: {
    sessionId: number;
    messages: IWebsochatMessageItem[];
  };
}

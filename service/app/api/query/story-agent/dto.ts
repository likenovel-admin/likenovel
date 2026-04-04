export interface IStoryAgentProductItem {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  statusCode?: string | null;
  latestEpisodeNo: number;
  contextStatus?: string | null;
}

export interface IGetStoryAgentProductsResponse {
  data: IStoryAgentProductItem[];
}

export interface IStoryAgentSessionItem {
  sessionId: number;
  productId: number;
  title: string;
  createdDate: string;
  updatedDate: string;
  productTitle?: string | null;
  productAuthorNickname?: string | null;
  coverImagePath?: string | null;
  latestEpisodeNo?: number;
  contextStatus?: string | null;
  canSendMessage?: boolean;
  unavailableMessage?: string | null;
}

export interface IGetStoryAgentSessionsResponse {
  data: IStoryAgentSessionItem[];
}

export interface ICreateStoryAgentSessionResponse {
  data: {
    sessionId: number;
    productId: number;
    title: string;
    product: IStoryAgentProductItem;
  };
}

export interface IStoryAgentMessageItem {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  createdDate?: string;
  referencedEpisodeNos?: number[] | null;
  reasonCards?: IStoryAgentReasonCardItem[] | null;
  actionCards?: IStoryAgentStarterActionItem[] | null;
  ctaCards?: IStoryAgentCtaCardItem[] | null;
}

export interface IStoryAgentStarterActionItem {
  label: string;
  prompt: string;
}

export interface IStoryAgentReasonCardItem {
  title: string;
  description: string;
}

export interface IStoryAgentCtaCardItem {
  type: "product_detail";
  label: string;
  productId?: number | null;
}

export interface IStoryAgentStarterItem {
  productTitle: string;
  scopeState?: "unknown" | "none" | "known";
  readEpisodeNo?: number | null;
  readEpisodeTitle?: string | null;
  latestEpisodeNo?: number;
  reasonCards?: IStoryAgentReasonCardItem[];
  ctaCards?: IStoryAgentCtaCardItem[];
  actions: IStoryAgentStarterActionItem[];
}

export interface IGetStoryAgentMessagesResponse {
  data: {
    session: IStoryAgentSessionItem;
    messages: IStoryAgentMessageItem[];
    starter?: IStoryAgentStarterItem | null;
  };
}

export interface IPostStoryAgentMessageResponse {
  data: {
    sessionId: number;
    messages: IStoryAgentMessageItem[];
  };
}

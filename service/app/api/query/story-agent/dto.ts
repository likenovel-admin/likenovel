export interface IStoryAgentProductItem {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  statusCode?: string | null;
  latestEpisodeNo: number;
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
}

export interface IGetStoryAgentMessagesResponse {
  data: {
    session: IStoryAgentSessionItem;
    messages: IStoryAgentMessageItem[];
  };
}

export interface IPostStoryAgentMessageResponse {
  data: {
    sessionId: number;
    messages: IStoryAgentMessageItem[];
  };
}

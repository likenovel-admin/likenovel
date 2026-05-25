// ── 온보딩 ──────────────────────────────────────────

export interface IOnboardingProduct {
  product_id: number;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  protagonist_type: string | null;
  protagonist_type_tags?: string[] | string | null;
  protagonist_job_tags?: string[] | string | null;
  protagonist_material_tags?: string[] | string | null;
  protagonist_goal_primary?: string | null;
  mood: string | null;
  worldview_tags?: string[] | string | null;
  axis_style_tags?: string[] | string | null;
  axis_romance_tags?: string[] | string | null;
  taste_tags?: string[] | string | null;
}

export interface IOnboardingTagItem {
  tag: string;
  count: number;
}

export interface IOnboardingTagTab {
  key: "hero" | "worldTone" | "relation";
  label: string;
  tags: IOnboardingTagItem[];
}

export interface IGetOnboardingProductsResponse {
  data: IOnboardingProduct[];
  tag_tabs?: IOnboardingTagTab[];
}

export interface IPostOnboardingResponse {
  data: {
    message: string;
    taste_summary?: string;
    dominant_type?: string | null;
  };
}

export interface IPostOnboardingDismissResponse {
  data: {
    message: string;
  };
}

// ── 취향 추천 섹션 ─────────────────────────────────

export interface IRecommendProduct {
  productId: number;
  title: string;
  coverUrl: string | null;
  authorNickname: string | null;
  episodeCount: number;
  matchReason: string;
  tasteTags?: string[];
  serialCycle?: string | null;
  priceType?: "free" | "paid" | null;
  ongoingState?: "ongoing" | "rest" | "end" | "stop" | null;
  monopolyYn?: "Y" | "N" | null;
  lastEpisodeDate?: string | null;
  newReleaseYn?: "Y" | "N";
  cpContractYn?: "Y" | "N";
  waitingForFreeYn?: "Y" | "N";
  sixNinePathYn?: "Y" | "N";
}

export interface IRecommendSection {
  title: string;
  dimension: string;
  reason: string;
  products: IRecommendProduct[];
}

export interface IGetTasteRecommendationsResponse {
  data: {
    sections: IRecommendSection[];
    needs_onboarding?: boolean;
  };
}

export interface IAiProductBrief {
  productId: number;
  title?: string | null;
  premise?: string | null;
  hook?: string | null;
  mood?: string | null;
  pacing?: string | null;
  protagonistType?: string | null;
  protagonistGoal?: string | null;
  tasteTags?: string[];
  worldviewTags?: string[];
  protagonistTypeTags?: string[];
  protagonistJobTags?: string[];
  protagonistMaterialTags?: string[];
  styleTags?: string[];
  romanceTags?: string[];
}

export interface IGetAiProductBriefsResponse {
  data: IAiProductBrief[];
}

// ── AI 챗 추천 ──────────────────────────────────────

export interface ITasteMatch {
  protagonist: number;
  mood: number;
  pacing: number;
}

export interface IAiRecommendResponse {
  data: {
    product: IRecommendProduct;
    reason: string;
    tasteMatch: ITasteMatch;
    taste_match?: ITasteMatch;
  };
}

export interface IAiChatRequest {
  messages: { role: "user" | "assistant"; content: string; product_id?: number }[];
  context?: {
    browsed_product_ids?: number[];
    trigger?: "browsing" | "manual";
    page_type?: "home" | "product" | "mypage" | "other";
    pathname?: string;
    current_product_id?: number;
    current_episode_id?: number;
  };
  preset?: "stacked-chapters" | "good-schedule" | "completed" | "trending" | null;
  exclude_product_ids?: number[];
  adult_yn?: "Y" | "N";
}

export interface IAiChatResponse {
  data: {
    reply: string;
    product?: IRecommendProduct;
    tasteMatch?: ITasteMatch;
    taste_match?: ITasteMatch;
  };
}

export interface IPostAiSignalEventBody {
  product_id: number;
  episode_id?: number;
  event_type: string;
  session_id?: string;
  active_seconds?: number;
  scroll_depth?: number;
  progress_ratio?: number;
  next_available_yn?: "Y" | "N";
  latest_episode_reached_yn?: "Y" | "N";
  event_payload?: Record<string, unknown>;
}

export interface IPostAiSignalEventResponse {
  data: {
    message: string;
  };
}

// ── AI 챗 히스토리 ────────────────────────────────────

export interface IChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  product?: IRecommendProduct;
  tasteMatch?: ITasteMatch;
}

export interface IGetChatHistoryResponse {
  data: IChatHistoryMessage[];
}

// ── 취향 프로파일 (마이페이지) ───────────────────────

export interface ITopProtagonist {
  type: string;
  count: number;
}

export interface ITasteProfileResponse {
  data: {
    has_profile: boolean;
    profile_source?: "onboarding" | "recent_reads" | "signal_only";
    taste_summary?: string;
    top_protagonists?: ITopProtagonist[];
    preferred_mood?: Record<string, number>;
    preferred_themes?: Record<string, number>;
    preferred_pacing?: string | null;
    taste_tags?: string[];
    axis_tags?: {
      worldview?: string[];
      job?: string[];
      material?: string[];
      romance?: string[];
      style?: string[];
      type?: string[];
      goal?: string[];
    };
    axis_top3?: {
      worldview?: { label: string; percent: number; score?: number }[];
      job?: { label: string; percent: number; score?: number }[];
      material?: { label: string; percent: number; score?: number }[];
      romance?: { label: string; percent: number; score?: number }[];
      style?: { label: string; percent: number; score?: number }[];
      type?: { label: string; percent: number; score?: number }[];
      goal?: { label: string; percent: number; score?: number }[];
    };
    axis_insights?: {
      worldview?: string;
      job?: string;
      material?: string;
      romance?: string;
      style?: string;
      type?: string;
      goal?: string;
    };
    axis_labels?: {
      worldview?: string;
      job?: string;
      material?: string;
      romance?: string;
      style?: string;
      type?: string;
      goal?: string;
    };
  };
}

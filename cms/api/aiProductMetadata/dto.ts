export interface IAiProductMetadataItem {
  product_id: number;
  title: string;
  author_name: string | null;
  price_type: string | null;
  analysis_status: "missing" | "pending" | "success" | "failed";
  analysis_attempt_count: number;
  exclude_from_recommend_yn: "Y" | "N";
  analysis_error_message: string | null;
  analyzed_at: string | null;
  updated_date: string | null;
}

export type AxisKey = "세" | "직" | "능" | "연" | "작" | "타" | "목";

export interface IGetAiProductMetadataParams {
  search_target?: string;
  search_word?: string;
  analysis_status?: string;
  exclude_from_recommend_yn?: string;
  page?: number;
  count_per_page?: number;
}

export interface IGetAiProductMetadataResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAiProductMetadataItem[];
}

export interface IAiProductMetadataDetail {
  product_id: number;
  title: string;
  author_name: string | null;
  price_type: string | null;
  status_code: string | null;
  synopsis_text: string | null;
  protagonist_type: string | null;
  protagonist_desc: string | null;
  heroine_type: string | null;
  heroine_weight: string | null;
  mood: string | null;
  pacing: string | null;
  premise: string | null;
  hook: string | null;
  episode_summary_text: string | null;
  protagonist_goal_primary: string | null;
  protagonist_material_tags: string[] | string | null;
  worldview_tags: string[] | string | null;
  protagonist_type_tags: string[] | string | null;
  protagonist_job_tags: string[] | string | null;
  axis_style_tags: string[] | string | null;
  axis_romance_tags: string[] | string | null;
  axis_labels?: Partial<Record<AxisKey, string[]>>;
  themes: string[] | string | null;
  similar_famous: string[] | string | null;
  taste_tags: string[] | string | null;
  raw_analysis: unknown;
  analysis_status: "missing" | "pending" | "success" | "failed";
  analysis_attempt_count: number;
  analysis_error_message: string | null;
  exclude_from_recommend_yn: "Y" | "N";
  analyzed_at: string | null;
  updated_date: string | null;
}

export interface IGetAiProductMetadataDetailResponse {
  data: IAiProductMetadataDetail;
}

export interface IPutAiProductMetadataRequest {
  protagonist_type?: string;
  protagonist_desc?: string;
  heroine_type?: string;
  heroine_weight?: string;
  mood?: string;
  pacing?: string;
  premise?: string;
  hook?: string;
  episode_summary_text?: string;
  protagonist_goal_primary?: string;
  protagonist_material_tags?: string[];
  worldview_tags?: string[];
  protagonist_type_tags?: string[];
  protagonist_job_tags?: string[];
  axis_style_tags?: string[];
  axis_romance_tags?: string[];
  axis_labels?: Partial<Record<AxisKey, string[]>>;
  themes?: string[];
  similar_famous?: string[];
  taste_tags?: string[];
}

export interface IAiProductMetadataCommandResponse {
  data: {
    message: string;
    analysis_status?: string;
    analysis_attempt_count?: number;
  };
}

export interface IPutAiProductMetadataExcludeRequest {
  product_id: number;
  exclude_from_recommend_yn: "Y" | "N";
}

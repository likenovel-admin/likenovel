export interface IAiOnboardingProductItem {
  id: number;
  product_id: number;
  sort_order: number;
  use_yn: "Y" | "N";
  title: string;
  cover_url: string | null;
  author_name: string | null;
  price_type: string | null;
  status_code: string | null;
  product_use_yn: "Y" | "N";
  product_open_yn: "Y" | "N";
  analysis_status: "missing" | "pending" | "success" | "failed";
  exclude_from_recommend_yn: "Y" | "N";
  created_date: string;
  updated_date: string;
}

export interface IAiOnboardingTagItem {
  tag: string;
  count: number;
}

export interface IAiOnboardingTagTab {
  key: "hero" | "worldTone" | "relation";
  label: string;
  tags: IAiOnboardingTagItem[];
}

export interface IGetAiOnboardingProductResponse {
  data: IAiOnboardingProductItem[];
  tag_tabs?: IAiOnboardingTagTab[];
  selected_tag_tabs?: IAiOnboardingTagTab[];
}

export interface IPutAiOnboardingProductsRequest {
  product_ids: number[];
  hero_tags?: string[];
  world_tone_tags?: string[];
  relation_tags?: string[];
}

export interface IAiOnboardingProductCommandResponse {
  data: {
    message: string;
    count: number;
  };
}

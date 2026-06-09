export interface IProductAiConsentItem {
  product_id: number;
  title: string;
  nickname: string | null;
  author_email: string | null;
  episode_count: number;
  open_yn: "Y" | "N";
  ai_promotion_yn: "Y" | "N";
  websochat_enabled_yn: "Y" | "N";
}

export interface IGetProductAiConsentResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProductAiConsentItem[];
}

export interface IGetProductAiConsentParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

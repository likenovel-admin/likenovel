export interface ICmsProductEvaluationItem {
  product_id: number;
  title: string;
  author_name: string;
  price_type: string;
  evaluation_score: number | null;
  evaluation_yn: string | null;
  updated_date: string | null;
}

export interface IGetCmsProductEvaluationResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: ICmsProductEvaluationItem[];
}

export interface IGetCmsProductEvaluationParams {
  price_type?: string;
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export interface IUpsertCmsProductEvaluationRequest {
  product_id: number;
  evaluation_score: number;
}

export interface IUpsertCmsProductEvaluationResponse {
  data: {
    message: string;
  };
}

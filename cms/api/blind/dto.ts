export interface IGetBlindListParams {
  page: number;
  count_per_page: number;
  blind_yn?: string;
  search_target?: string;
  search_word?: string;
}

export interface IBlindProduct {
  product_id: number;
  title: string;
  user_id: number;
  author_name: string;
  author_email?: string;
  primary_genre: string;
  open_yn: string;
  blind_yn: string;
  created_date: string;
  episode_count: number;
}

export interface IGetBlindListResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IBlindProduct[];
}

export interface IPostBatchBlindRequest {
  product_ids: number[];
  blind_yn: string;
}

export interface IPostBatchOpenRequest {
  product_ids: number[];
  open_yn: string;
}

export interface IBlindDownloadResponse {
  data: Blob;
  headers: Headers;
}

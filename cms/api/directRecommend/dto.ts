import { IDirectRecommend } from "@/types/directRecommend";

export interface IGetDirectRecommendResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IDirectRecommend[];
}

export interface IGetDirectRecommendParams {
  page?: number;
  count_per_page?: number;
}

export type IGetDirectRecommendDetailResponse = IDirectRecommend;

export interface IDirectRecommendRequest {
  name: string;
  order: number;
  product_ids: number[];
  exposure_start_date: string;
  exposure_end_date: string;
  exposure_start_time_weekday: string;
  exposure_end_time_weekday: string;
  exposure_start_time_weekend: string;
  exposure_end_time_weekend: string;
  source_type?: "manual" | "external_distribution";
  source_platform?: "kakaopage" | "ridi" | null;
}

export interface IAddEditDirectRecommendResponse {
  data: {
    message: string;
  };
}

export interface IDeleteDirectRecommendResponse {
  data: {
    message: string;
  };
}

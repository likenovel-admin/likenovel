import { IBanner } from "@/types/banner";

export interface IGetBannerResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IBanner[];
}

export interface IGetBannerParams {
  page?: number;
  count_per_page?: number;
}

export type IGetBannerDetailResponse = IBanner;

export interface IBannerRequest {
  position: string;
  division: string | null;
  title: string;
  show_start_date: string;
  show_end_date: string;
  show_order?: number;
  url: string;
  image_id?: number;
  mobile_image_id?: number;
}

export interface IAddEditBannerResponse {
  data: {
    message: string;
  };
}

export interface IDeleteBannerResponse {
  data: {
    message: string;
  };
}

import { IDirectPromotion } from "@/types/directPromotion";

export interface IGetDirectPromotionResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IDirectPromotion[];
}

export interface IGetDirectPromotionParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  status?: string;
}

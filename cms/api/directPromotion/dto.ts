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

export interface IPostDirectPromotionGiftRequest {
  product_ids: number[];
  num_of_ticket_per_person: number;
  start_date: string;
  end_date: string;
}

export interface IPostDirectPromotionGiftResponse {
  result: {
    created_count: number;
  };
}

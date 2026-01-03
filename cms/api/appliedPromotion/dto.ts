import { IAppliedPromotion } from "@/types/appliedPromotion";

export interface IGetAppliedPromotionResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAppliedPromotion[];
}

export interface IGetAppliedPromotionParams {
  page?: number;
  count_per_page?: number;
  status?: string;
  search_target?: string;
  search_word?: string;
}

export type IGetAppliedPromotionDetailResponse = IAppliedPromotion;

export interface IAppliedPromotionRequest {
  product_id: number;
  type: string;
  status?: string;
  start_date: string;
  end_date: string;
  num_of_ticket_per_person?: number;
}

export interface IAppliedPromotionResponse {
  data: {
    message: string;
  };
}

export interface IAcceptAppliedPromotionResponse {
  data: {
    message: string;
  };
}

export interface IDenyAppliedPromotionResponse {
  data: {
    message: string;
  };
}

export interface IEndAppliedPromotionResponse {
  data: {
    message: string;
  };
}

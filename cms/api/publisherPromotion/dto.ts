import {
  IPublisherPromotion,
  IPublisherPromotionInList,
} from "@/types/publisherPromotion";

export interface IGetPublisherPromotionResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IPublisherPromotionInList[];
}

export interface IGetPublisherPromotionParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export type IGetPublisherPromotionCategoriesResponse = IPublisherPromotion;

export interface IPublisherPromotionRequest {
  product_id: number;
  show_order: number;
}

export interface IAddEditPublisherPromotionResponse {
  data: {
    message: string;
  };
}

export interface IDeletePublisherPromotionResponse {
  data: {
    message: string;
  };
}

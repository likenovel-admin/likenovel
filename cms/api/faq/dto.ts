import { IFaq } from "@/types/faq";

export interface IGetFaqResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IFaq[];
}

export interface IGetFaqParams {
  page?: number;
  count_per_page?: number;
  faq_type?: string;
}

export type IGetFaqDetailResponse = IFaq;

export interface IFaqRequest {
  faq_type: string;
  subject: string;
  content: string;
}

export interface IAddEditFaqResponse {
  data: {
    message: string;
  };
}

export interface IDeleteFaqResponse {
  data: {
    message: string;
  };
}

export interface IFaqCategory {
  code: string;
  name: string;
  sort_order: number;
}

export interface IFaqCategoryRequest {
  code: string;
  name: string;
}

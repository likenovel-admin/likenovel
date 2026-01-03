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
}

export type IGetFaqDetailResponse = IFaq;

export interface IFaqRequest {
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

import { INotice, INoticeDetail } from "@/types/notice";

export interface IGetNoticeResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  data: INotice[];
}

export interface IGetNoticeParams {
  page?: number;
  count_per_page?: number;
}

export type IGetNoticeDetailResponse = {
  data: INoticeDetail;
};

export interface INoticeRequest {
  subject: string;
  content: string;
  primary_yn: string;
  file_id?: number;
  top_bar_yn?: "Y" | "N";
  top_bar_text?: string;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
}

export interface IAddEditNoticeResponse {
  data: {
    message: string;
  };
}

export interface IDeleteNoticeResponse {
  data: {
    message: string;
  };
}

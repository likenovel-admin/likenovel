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

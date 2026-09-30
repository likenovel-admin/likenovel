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
  top_bar_link_url?: string | null;
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

// GET /v1/query/notices/top-bar: 사이트에 지금 떠 있는 상단 띠(없으면 null)
export interface IGetLiveNoticeTopBarResponse {
  data: {
    noticeId: number;
    text: string;
    endAt?: string | null;
  } | null;
}

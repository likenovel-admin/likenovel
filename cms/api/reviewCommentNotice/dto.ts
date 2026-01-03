import {
  IComment,
  ICommentInList,
  IReviewInList,
  INoticeInList,
  INotice,
  IReview,
  IReviewDetail,
} from "@/types/reviewCommentNotice";

export interface IGetReviewCommentNoticeResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: (ICommentInList | IReviewInList | INoticeInList)[];
}

export interface IGetReviewCommentNoticeAllResponse {
  data: (IReview | ICommentInList | INotice)[];
}

export interface IGetReviewCommentNoticeParams {
  page?: number;
  count_per_page?: number;
  search_start_date?: string;
  search_end_date?: string;
  start_date?: string;
  end_date?: string;
  search_target?: string;
  search_word?: string;
  type?: string;
}

export type IGetGetNoticeDetailResponse = INotice;

export interface IUpdateNoticeRequest {
  product_id?: number;
  user_id?: number;
  subject?: string;
  content?: string;
  publish_reserve_date?: string;
  open_yn?: string;
  use_yn?: string;
}

export interface IUpdateNoticeResponse {
  data: {
    message: string;
  };
}

export interface IDeleteNoticeResponse {
  data: {
    message: string;
  };
}

export type IGetGetCommentDetailResponse = IComment;

export interface IUpdateCommentRequest {
  product_id?: number;
  episode_id?: number;
  user_id?: number;
  profile_id?: number;
  author_recommend_yn?: string;
  content?: string;
  use_yn?: string;
  open_yn?: string;
  display_top_yn?: string;
}

export interface IUpdateCommentResponse {
  data: {
    message: string;
  };
}

export interface IDeleteCommentResponse {
  data: {
    message: string;
  };
}

export type IGetGetReviewDetailResponse = IReviewDetail;

export interface IUpdateReviewRequest {
  product_id?: number;
  episode_id?: number;
  user_id?: number;
  profile_id?: number;
  author_recommend_yn?: string;
  content?: string;
  review_text?: string;
  open_yn?: string;
  title?: string;
  display_top_yn?: string;
}

export interface IUpdateReviewResponse {
  data: {
    message: string;
  };
}

export interface IDeleteReviewResponse {
  data: {
    message: string;
  };
}

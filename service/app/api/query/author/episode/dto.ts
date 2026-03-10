export interface ISelectPresignedFilePathResponseByEpisode {
  data: { episodeImageFileId: number; episodeImageUploadPath: string };
}

export interface IMakeEpisodeRequest {
  title: string;
  content: string;
  author_comment: string;
  evaluation_open_yn: "Y" | "N";
  comment_open_yn: "Y" | "N";
  episode_open_yn: "Y" | "N";
  publish_reserve_yn: "Y" | "N";
  publish_reserve_date: Date | string | null;
  price_type: "free" | "paid" | null;
}

export interface IMakeNoticeRequest {
  title: string;
  content: string;
  open_yn: "Y" | "N";
  publish_reserve_yn: "Y" | "N";
  publish_reserve_date: Date | string | null;
}

export interface ISelectEpisodeResponse {
  data: {
    episodeId: number;
    title: string;
    content: string;
    authorComment: string;
    evaluationOpenYn: "Y" | "N";
    commentOpenYn: "Y" | "N";
    episodeOpenYn: "Y" | "N";
    publishReserveYn: "Y" | "N";
    publishReserveDate: Date | null;
    priceType: "free" | "paid";
    liked: "Y" | "N";
  };
}

export interface ISelectNoticeResponse {
  data: {
    productNoticeId: number;
    title: string;
    content: string;
    openYn: "Y" | "N";
    publishReserveYn: "Y" | "N";
    publishReserveDate: string;
  };
}

export interface IGetProductNoticeDetailResponse {
  data: {
    productNoticeId: number;
    title: string;
    content: string;
    openYn: "Y" | "N";
    publishReserveYn: "Y" | "N";
    publishReserveDate: string;
  };
}

export interface ICreateAuthorEpisodePredictionRequest {
  prediction_key?: string;
  product_id: number;
  screen_name: string;
  target_week_start_date: string;
  target_weekly_upload_goal: number;
  recommended_weekly_upload_goal: number;
  uploads_this_week: number;
  remaining_target_uploads: number;
  remaining_recommended_uploads: number;
  prediction_base_uploads: number;
  sample_episode_count: number;
  sample_window_type: string;
  prediction_basis: "target_goal" | "recommended_goal";
  expected_views_min: number;
  expected_views_max: number;
  expected_rank_gain_min: number;
  expected_rank_gain_max: number;
  has_enough_data: "Y" | "N";
  model_version: string;
}

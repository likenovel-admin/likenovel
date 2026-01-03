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
  price_type: "free" | "paid";
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

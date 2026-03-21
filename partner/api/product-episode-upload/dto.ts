export type TOpenYn = "Y" | "N";
export type TEpisodePriceType = "free" | "paid";

export interface IEpubEpisodeUploadRequest {
  title: string;
  epub_file_id: number;
  episode_no?: number;
  author_comment?: string;
  evaluation_open_yn: TOpenYn;
  comment_open_yn: TOpenYn;
  episode_open_yn: TOpenYn;
  publish_reserve_yn: TOpenYn;
  publish_reserve_date?: string;
  price_type?: TEpisodePriceType;
}

export interface IEpubEpisodeBatchUploadRequest {
  episodes: IEpubEpisodeUploadRequest[];
}

export interface IEpisodeTitleBulkUpdateItem {
  no: number;
  file_name: string;
  title: string;
}

export interface IEpisodeTitleBulkUpdateRequest {
  episodes: IEpisodeTitleBulkUpdateItem[];
}

export interface IEpisodeReviewRequest {
  episode_ids: number[];
}

export interface IEpisodeReviewCancelRequest {
  apply_ids: number[];
}

export interface IEpubEpisodeUploadResponse {
  data: {
    episodeId: number;
    applyIds?: number[];
  };
}

export interface IEpubEpisodeBatchUploadResponse {
  data: {
    count: number;
    episodeIds: number[];
    applyIds?: number[];
  };
}

export interface IEpisodeReviewResponse {
  data: {
    count: number;
    applyIds: number[];
  };
}

export interface IEpisodeReviewCancelResponse {
  data: {
    count: number;
    applyIds: number[];
  };
}

export interface IEpisodeDeleteRequest {
  episode_ids: number[];
}

export interface IEpisodeDeleteResponse {
  data: {
    count: number;
    episodeIds: number[];
  };
}

export interface IEpisodeTitleBulkUpdateResponse {
  data: {
    count: number;
    episodeIds: number[];
  };
}

export interface IEpisodeSaleStartRequest {
  episode_ids: number[];
}

export interface IEpisodeSaleReserveRequest {
  episode_ids: number[];
  publish_reserve_date: string;
}

export interface IEpisodeSaleReserveCancelRequest {
  episode_ids: number[];
}

export interface IEpisodeSaleResponse {
  data: {
    count: number;
    episodeIds: number[];
    skippedEpisodeIds?: number[];
  };
}

export interface ISelectEpisodeObject {
  episodeId: number;
  productId: number;
  episodeNo: number;
  episodeTitle: string;
  episodeTextCount: number;
  commentOpenYn: "Y" | "N";
  countEvaluation: number;
  countComment: number;
  priceType: "free" | "paid";
  evaluationOpenYn: "Y" | "N";
  publishReserveDate: string;
  countHit: number;
  countRecommend: number;
  episodeOpenYn: "Y" | "N";
  openChangedDate?: string | null;
  ownType: "rental" | "own" | string;
  createdDate: string;
  rentalRemaining: {
    days: number;
    hours: number;
  } | null;
  usage: {
    readYn: "Y" | "N";
    recommendYn: "Y" | "N";
  };
}

export interface IUseSelectEpisodesResponse {
  data: {
    latestEpisodeNo: number;
    latestEpisodeId: number;
    latestEpisodeTitle: string;
    episodes: ISelectEpisodeObject[];
    pagination: {
      totalCount: number;
      page: number;
      limit: number;
    };
  };
}

export interface ISelectViewerPathResponse {
  data: {
    product_id: number; // 작품 ID
    title: string; // 작품 제목
    coverImagePath: string | null; // 작품 표지 이미지 경로
    episodeNo?: number | null;
    episodeTitle: string; // 에피소드 제목
    epubFilePath: string; // EPUB 파일 경로 (URL)
    privateYn?: "Y" | "N"; // 회차 비공개 여부
    productPrivateYn?: "Y" | "N"; // 작품 비공개 여부
    bingeWatchYn: "Y" | "N"; // 정주행 여부
    commentCount: number; // 댓글 수
    recommendYn: "Y" | "N"; // 추천 여부
    bookmarkYn: "Y" | "N"; // 북마크 여부
    authorComment: string; // 작가 코멘트
    evaluationYn: "Y" | "N"; // 평가 여부
    nextEpisodes: number; // 다음 에피소드 수
    commentOpenYn: "Y" | "N"; // 댓글 열림 여부
    evaluationOpenYn: "Y" | "N"; // 평가 열림 여부
    nextEpisodeId: number; // 다음 에피소드 ID
    previousEpisodeId: number; // 전에피소드 ID
    liked: "Y" | "N"; // 좋아요 여부
    priceType?: "free" | "paid" | null;
    ownType?: "rental" | "own" | null;
    previousEpisodeOwnType: "rental" | "own" | null;
    nextEpisodeOwnType: "rental" | "own" | null;
    nextEpisodePriceType: "free" | "paid" | null;
    previousEpisodePriceType: "free" | "paid" | null;
    nextEpisodeRentalRemaining: {
      days: number;
      hours: number;
    } | null;
    previousEpisodeRentalRemaining: {
      days: number;
      hours: number;
    } | null;
    productPriceType?: "free" | "paid" | null;
    websochatSupported?: boolean;
    websochatContextStatus?: string | null;
    websochatPublishedLatestEpisodeNo?: number | null;
    websochatSyncedLatestEpisodeNo?: number | null;
    websochatEligible?: boolean;
  };
}

export interface ISelectViewerWebsochatReadinessResponse {
  data: {
    product_id: number;
    episodeNo: number;
    websochatSupported: boolean;
    websochatContextStatus: string | null;
    websochatPublishedLatestEpisodeNo: number;
    websochatSyncedLatestEpisodeNo: number;
    websochatEligible: boolean;
  };
}

export type ISelectMyEvaluationResponse = {
  data: Record<string, string>;
};

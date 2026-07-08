import { IComment } from "@/components/common/CommentArea";
import {
  IEpisode,
  IEvaluation,
  INotice,
  IProduct,
  IRentalTicket,
} from "@/types";

export interface IUseSelectProductsResponse {
  data: IProduct[];
}

export interface IUseSelectWaitForFreeProductsResponse {
  data: Record<string, IProduct[]>;
}

export interface IUseSelect69PassProductsResponse {
  data: Record<string, IProduct[]>;
}

export interface IPublisherPromotionProductsResponse {
  data: IProduct[];
  title?: string;
}

interface SelectProductDetailResponseObject {
  product: IProduct;
  episodes: IEpisode[];
  evaluations: IEvaluation;
  notices: INotice[];
  comments: IComment[];
  issuedVouchers: {
    amount: number;
    message: string;
    type: string;
  }[];
}

export interface IUseSelectProductDetailResponse {
  data: SelectProductDetailResponseObject;
}

export interface ISectionData {
  products: IProduct[];
  suggestId: number;
  suggestName: string;
  suggestTarget: string;
  suggestTitle: string;
}

interface SelectSuggestMainProductsResponseObject {
  sectionData: ISectionData;
  sectionNo: number;
}

export interface IUseSelectSuggestMainProductsResponse {
  data: SelectSuggestMainProductsResponseObject[];
}

export interface IUseSelectMainRuleSlotsResponse {
  data: ISectionData[];
}

export interface IGetEpisodeProductParams {
  product_id: string;
  user_id?: string;
  page?: number;
  limit?: number;
  order_by?: "episodeNo" | "date";
  order_dir?: "asc" | "desc";
}

export interface IEpisodeListResponse {
  data: {
    latestEpisodeNo: number;
    latestEpisodeId: number;
    latestEpisodeTitle: string;
    pagination: {
      totalCount: number;
      page: number;
      limit: number;
    };
    episodes: Array<{
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
      createdDate: string;
      countLike: number;
      ownType: "rental" | "own" | string;
      rentalRemaining: {
        days: number;
        hours: number;
      } | null;
      usage: {
        readYn: "Y" | "N";
        recommendYn: "Y" | "N";
      };
    }>;
  };
}

export interface IGetAvailableTicketsResponse {
  data: IRentalTicket[];
  count_by_type: {
    free_for_first: number;
    reader_of_prev: number;
    waiting_for_free: number;
    "6-9-path": number;
    gift: number;
    quest: number;
    event: number;
  };
  wff_next_charge_at: string | null;
  wff_next_charge_at_ms: number | null;
  wff_recharge_pending: boolean;
}

export interface ISuggestByRecentViewedResponse {
  data: IProduct[];
}

export interface IGetRecentProductResponse {
  data: IProduct[];
}

export interface IGetDirectRecommendResponse {
  data: {
    // recommendId: number;
    // recommendName: string;
    // order: number;
    // products: IProduct[];
    title: string;
    productList: IProduct[];
  }[];
}

export type HomeTickerFreshness =
  | "weekly"
  | "near_real_time"
  | "ranking_snapshot"
  | "metric_snapshot"
  | "trend_snapshot"
  | "fallback";

export type HomeTickerTargetType = "product" | "notice" | "none";

export interface IHomeTickerItem {
  type: string;
  message: string;
  productId: number | null;
  targetType?: HomeTickerTargetType;
  targetId?: number | null;
  priority: number;
  freshness: HomeTickerFreshness;
}

export interface IGetHomeTickerResponse {
  asOf: string;
  refreshAfterSeconds: number;
  rotateEveryMs: number;
  items: IHomeTickerItem[];
}

export interface IMainSingleSlotItem {
  singleSlotId: number;
  slotKey: string;
  slotName: string;
  slotOrder: number;
  summaryText: string;
  product: IProduct;
}

export interface IGetMainSingleSlotsResponse {
  data: IMainSingleSlotItem[];
}

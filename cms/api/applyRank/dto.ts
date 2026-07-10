import { IApplyRank } from "@/types/applyRank";

export interface IGetApplyRankResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IApplyRank[];
}

export interface IGetApplyRankParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  status?: string;
}

export interface IAcceptApplyRankResponse {
  data: {
    message: string;
  };
}
export interface IDenyApplyRankResponse {
  data: {
    message: string;
  };
}

export interface IApplyPaidConversionRequest {
  id: string;
  paidEpisodeNo: number;
  waitingForFreeEnabled: boolean;
  waitingForFreePeriodMonths: number;
}

export interface IApplyPaidConversionResponse {
  data: {
    productId: number;
    paidEpisodeNo: number;
    waitingForFreeEnabled: boolean;
    waitingForFreePromotionId: number | null;
    waitingForFreePeriodMonths: number | null;
    waitingForFreeActivationDelayMinutes: number | null;
    waitingForFreeDirectSlotManual: boolean;
  };
}

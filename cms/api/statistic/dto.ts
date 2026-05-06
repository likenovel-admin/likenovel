import {
  IStatisticSite,
  IStatisticPayment,
  IStatisticPaymentByUser,
  IStatisticWebsochatModelSummary,
  IStatisticWebsochatProductSummary,
  IStatisticWebsochatRouteSummary,
  IStatisticWebsochatUsage,
  IStatisticWebsochatUsageSummary,
} from "@/types/statistic";

export interface IGetStatisticSiteResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticSite[];
}

export interface IGetStatisticSiteAllResponse {
  data: IStatisticSite[];
}

export interface IGetStatisticSiteParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticPaymentResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticPayment[];
}

export interface IGetStatisticPaymentAllResponse {
  data: IStatisticPayment[];
}

export interface IGetStatisticPaymentParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticPaymentByUserResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticPaymentByUser[];
}

export interface IGetStatisticPaymentByUserAllResponse {
  data: IStatisticPaymentByUser[];
}

export interface IGetStatisticPaymentByUserParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  search_target?: string;
  search_word?: string;
}

export interface IGetStatisticWebsochatUsageResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  summary: IStatisticWebsochatUsageSummary;
  model_summary: IStatisticWebsochatModelSummary[];
  route_summary: IStatisticWebsochatRouteSummary[];
  product_summary: IStatisticWebsochatProductSummary[];
  results: IStatisticWebsochatUsage[];
}

export interface IGetStatisticWebsochatUsageParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  search_target?: string;
  search_word?: string;
  product_id?: number;
  model_used?: string;
  route_mode?: string;
  fallback_used?: string;
}

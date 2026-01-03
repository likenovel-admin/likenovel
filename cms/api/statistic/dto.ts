import {
  IStatisticSite,
  IStatisticPayment,
  IStatisticPaymentByUser,
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

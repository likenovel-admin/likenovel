import { IHourlyInflow, IHourlyInflowDetail } from "@/types/hourly-inflow";

export interface IGetHourlyInflowsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IHourlyInflow[];
}

export interface IGetHourlyInflowParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export interface IGetHourlyInflowDetailParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_date?: string;
}

export type IGetHourlyInflowDetailResponse = IHourlyInflowDetail[];

import {
  IProductDiscoveryStatistics,
  IProductDiscoveryStatisticsDetail,
} from "@/types/product-discovery-statistics";

export interface IGetProductDiscoveryStatisticssResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProductDiscoveryStatistics[];
}

export interface IGetProductDiscoveryStatisticsParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  scope?: "contracted";
}

export type IGetProductDiscoveryStatisticsDetailResponse =
  IProductDiscoveryStatisticsDetail;

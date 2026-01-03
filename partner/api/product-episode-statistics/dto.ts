import { IProductEpisodeStatistic } from "@/types/product-episode-statistics";

export interface IGetProductEpisodeStatisticsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProductEpisodeStatistic[];
}

export interface IGetProductEpisodeStatisticParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

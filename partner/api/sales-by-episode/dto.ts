import { ISaleByEpisode } from "@/types/sales-by-episode";

export interface IGetSaleByEpisodesResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: ISaleByEpisode[];
}

export interface IGetSaleByEpisodeParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

export interface IGetSaleByEpisodeDetailResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: ISaleByEpisode[];
}

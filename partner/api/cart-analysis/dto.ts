import { ICartAnalysis } from "@/types/cart-analysis";

export interface IGetCartAnalysissResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: ICartAnalysis[];
}

export interface IGetCartAnalysisParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  type?: string;
}

import { IMonthlySettlement } from "@/types/monthly-settlement";

export interface IGetMonthlySettlementsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMonthlySettlement[];
}

export interface IGetMonthlySettlementParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

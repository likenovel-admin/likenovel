import {
  IIncomeSettlement,
  IIncomeSettlementSummary,
} from "@/types/income-settlement";

export interface IGetIncomeSettlementsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IIncomeSettlement[];
}

export interface IGetIncomeSettlementParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

export type IGetIncomeSettlementSummaryResponse = IIncomeSettlementSummary;

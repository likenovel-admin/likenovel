import { IIncomeRecode } from "@/types/income-recodes";

export interface IGetIncomeRecodesResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IIncomeRecode[];
}

export interface IGetIncomeRecodeParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

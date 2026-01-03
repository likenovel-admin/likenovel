import { IProductContractOfferDeduction } from "@/types/product-contract-offer-deduction";

export interface IGetProductContractOfferDeductionsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProductContractOfferDeduction[];
}

export interface IGetProductContractOfferDeductionParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

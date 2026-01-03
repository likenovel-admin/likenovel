import { IProduct } from "@/types/product";

export type IGetProductResponse = IProduct[];

export interface IGetProductParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  contract_type?: string;
  status_code?: string;
}

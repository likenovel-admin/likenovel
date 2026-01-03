import { IGenre } from "@/types/genre";
import { IProduct } from "@/types/product";

export interface IGetProductsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProduct[];
}

export interface IGetProductParams {
  contract_type?: string;
  page?: number;
  count_per_page?: number;
  status_code?: string;
  search_target?: string;
  search_word?: string;
  start_date?: string;
  end_date?: string;
  from_episode_sales_page?: number;
}

export interface IUpdateProductRequest {
  title?: string;
  ratings_code?: string;
  primary_genre_id?: number;
  sub_genre_id?: number;
  status_code?: string;
  uci?: string;
  isbn?: string;
  series_regular_price?: number;
  single_regular_price?: number;
  cp_company_name?: string;
  cp_id?: number;
  monopoly_yn?: "Y" | "N";
  open_yn?: "Y" | "N";
  cp_offered_price?: number;
  cp_settlement_rate?: number;
  cp_author_profit?: number;
  cp_contract_price?: number;
}

export interface IUpdateProductResponse {
  data: {
    message: string;
  };
}

export type IGetProductDetailResponse = IProduct;

export type IGetProductGenreResponse = IGenre[];

export type IGetCPCompanyResponse = {
  company_name: string;
}[];

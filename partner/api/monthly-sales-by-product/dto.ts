import {
  IMonthlySaleByProduct,
  IMonthlySaleByProductDetail,
} from "@/types/monthly-sales-by-product";

export interface IGetMonthlySaleByProductsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMonthlySaleByProduct[];
}

export interface IGetMonthlySaleByProductParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

export type IGetMonthlySaleByProductDetailResponse = {
  result: IMonthlySaleByProductDetail;
  summary: {
    paid_price: number;
    free_price: number;
    sum_price: number;
    tax_price: number;
    total_price: number;
  };
};

export interface IUpdateMonthlySaleByProductBody {
  sum_settlement_price_web?: number;
  sum_settlement_comped_ticket_price?: number;
  tax_price?: number;
  settlement_rate?: number;
  fee?: number;
}

export interface IUpdateMonthlySaleByProductResponse {
  data: {
    message: string;
  };
}

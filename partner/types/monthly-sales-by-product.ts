export interface IMonthlySaleByProduct {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  contract_type: string;
  cp_company_name: string;
  paid_open_date: string;
  isbn: string;
  uci: string;
  series_regular_price: number;
  sale_price: number;
  sum_normal_price_web: number;
  sum_normal_price_playstore: number;
  sum_normal_price_ios: number;
  sum_normal_price_onestore: number;
  sum_ticket_price_web: number;
  sum_ticket_price_playstore: number;
  sum_ticket_price_ios: number;
  sum_ticket_price_onestore: number;
  sum_comped_ticket_price: number;
  fee_web: number;
  fee_playstore: number;
  fee_ios: number;
  fee_onestore: number;
  fee_comped_ticket: number;
  sum_refund_price_web: number;
  sum_refund_price_playstore: number;
  sum_refund_price_ios: number;
  sum_refund_price_onestore: number;
  sum_refund_comped_ticket_price: number;
  settlement_rate_web: number;
  settlement_rate_playstore: number;
  settlement_rate_ios: number;
  settlement_rate_onestore: number;
  settlement_rate_comped_ticket: number;
  sum_settlement_price_web: number;
  sum_settlement_comped_ticket_price: number;
  tax_price: number;
  total_price: number;
  created_date: string;
  updated_date: string;
}

export interface IMonthlySaleByProductDetail {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  contract_type: string;
  cp_company_name: string;
  paid_open_date: string | null;
  isbn: string;
  uci: string;
  series_regular_price: number;
  sale_price: number;

  sum_normal_price_web: number;
  sum_normal_price_playstore: number;
  sum_normal_price_ios: number;
  sum_normal_price_onestore: number;

  sum_ticket_price_web: number;
  sum_ticket_price_playstore: number;
  sum_ticket_price_ios: number;
  sum_ticket_price_onestore: number;

  sum_comped_ticket_price: number;

  fee_web: number;
  fee_playstore: number;
  fee_ios: number;
  fee_onestore: number;
  fee_comped_ticket: number;

  sum_refund_price_web: number;
  sum_refund_price_playstore: number;
  sum_refund_price_ios: number;
  sum_refund_price_onestore: number;
  sum_refund_comped_ticket_price: number;

  settlement_rate_web: number;
  settlement_rate_playstore: number;
  settlement_rate_ios: number;
  settlement_rate_onestore: number;
  settlement_rate_comped_ticket: number;

  sum_settlement_price_web: number;
  sum_settlement_comped_ticket_price: number;

  tax_price: number;
  total_price: number;

  created_id: number;
  created_date: string; // ISO format
  updated_id: number;
  updated_date: string; // ISO format
}

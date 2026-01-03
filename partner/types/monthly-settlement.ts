export interface IMonthlySettlement {
  author_name: string;
  cp_name: string;
  id: number;
  product_id: number;
  item_type: string; // e.g. "normal"
  device_type: string; // e.g. "web"
  sum_total_sales_price: number;
  fee: number;
  net_sales_price: number;
  taxable_price: number;
  vat_price: number;
  settlement_price: number;
  platform_revenue: number;
  privious_offer_amount: number;
  current_offer_amount: number;
  final_settlement_price: number;
  created_id: number;
  created_date: string; // ISO 8601 date string
  updated_id: number;
  updated_date: string; // ISO 8601 date string
}

export interface IProductContractOfferDeduction {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  contract_type: string; // e.g., "일반"
  cp_company_name: string;
  offer_amount: number;
  privious_offer_amount: number;
  settlement_price: number;
  current_offer_amount: number;
  created_id: number;
  created_date: string; // ISO date string
  updated_id: number;
  updated_date: string; // ISO date string
  offer_id: number;
}

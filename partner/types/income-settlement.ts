export interface IIncomeSettlement {
  id: number;
  product_id: number;
  item_type: "sponsorship" | string;
  device_type: "web" | "app" | string;
  sum_income_price: number;
  total_fee_rate: number;
  sum_income_price_exclude_fee: number;
  withholding_tax_rate: number;
  sum_income_price_final: number;
  created_id: number | null;
  created_date: string;
  updated_id: number | null;
  updated_date: string;
  author_name: string;
  sum_donation_price: number;
  enable_settlement: 0 | 1;
  settled_price: number;
  sum_etc_income_price: number;
}

interface IncomeDetails {
  sum_income_price: number;
  total_fee_rate: number;
  sum_income_price_exclude_fee: number;
  withholding_tax_rate: number;
  sum_income_price_final: number;
}

interface Sponsorship {
  web: IncomeDetails;
  ios: IncomeDetails;
  playstore: IncomeDetails;
  onestore: IncomeDetails;
}

interface Current {
  sponsorship: Sponsorship;
  ad: IncomeDetails;
}

interface Accumulated {
  income_sponsorship: number;
  income_etc: number;
  enable_settlement_price: number;
  completed_settlement_price: number;
}

export interface IIncomeSettlementSummary {
  current: Current;
  accumulated: Accumulated;
}

export interface IStatisticSite {
  DAU: number;
  MAU: number;
  date: string;
  login_count: number;
  page_view: number;
  signin_count: number;
  signoff_count: number;
  visitors: number;
}

export interface IStatisticPayment {
  date: string;
  pay_count: number;
  pay_coin: number;
  pay_amount: number;
  use_coin_count: number;
  use_coin: number;
  donation_count: number;
  donation_coin: number;
  ad_revenue: number;
}

export interface IStatisticPaymentByUser {
  date: string;
  order_datetime?: string;
  orderDatetime?: string;
  order_no?: string | number;
  orderNo?: string | number;
  user_id?: number;
  userId?: number;
  email: string;
  nickname: string;
  pay_count: number;
  pay_coin: number;
  pay_amount: number;
  use_coin_count: number;
  use_coin: number;
  donation_count: number;
  donation_coin: number;
  ad_revenue: number;
  cash_order_id?: number | null;
  cashOrderId?: number | null;
  cash_order_count?: number;
  cashOrderCount?: number;
}

export interface IStatisticWebsochatUsageSummary {
  total_turn_count: number;
  session_count: number;
  product_count: number;
  user_count: number;
  charged_turn_count: number;
  charged_cash: number;
  fallback_count: number;
}

export interface IStatisticWebsochatModelSummary {
  model_used: string;
  turn_count: number;
  charged_cash: number;
  fallback_count: number;
}

export interface IStatisticWebsochatRouteSummary {
  route_mode: string;
  turn_count: number;
  charged_cash: number;
}

export interface IStatisticWebsochatProductSummary {
  product_id: number;
  product_title: string;
  turn_count: number;
  session_count: number;
  charged_cash: number;
}

export interface IStatisticWebsochatUsage {
  usage_log_id: number;
  session_id: number;
  product_id: number;
  product_title: string;
  session_title: string;
  user_id?: number | null;
  email?: string | null;
  nickname?: string | null;
  guest_key?: string | null;
  model_used: string;
  route_mode: string;
  intent?: string | null;
  fallback_used: "Y" | "N";
  charged_cash: number;
  created_date: string;
}

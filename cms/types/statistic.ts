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
}

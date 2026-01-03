export interface ISponsorshipRecode {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  user_name: string;
  donation_price: number;
  settlement_status: string;
  created_date: string; // ISO datetime string
  updated_date: string; // ISO datetime string
}

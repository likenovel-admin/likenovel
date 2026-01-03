export interface IProductEpisodeStatistic {
  product_id: number;
  title: string;
  price_type: "free" | "paid" | string;
  product_type: string | null;
  status_code: string;
  ratings_code: string;
  synopsis_text: string;
  user_id: number;
  author_id: number;
  author_name: string;
  illustrator_id: number | null;
  illustrator_name: string | null;
  publish_regular_yn: "Y" | "N";
  publish_days: string;
  thumbnail_file_id: number;
  primary_genre_id: number;
  sub_genre_id: number | null;
  count_hit: number;
  count_cp_hit: number;
  count_recommend: number;
  count_bookmark: number;
  count_unbookmark: number;
  open_yn: "Y" | "N";
  approval_yn: "Y" | "N";
  monopoly_yn: "Y" | "N";
  contract_yn: "Y" | "N";
  paid_open_date: string; // ISO format
  paid_episode_no: number | null;
  last_episode_date: string; // ISO format
  isbn: string | null;
  uci: string | null;
  single_regular_price: number;
  series_regular_price: number;
  sale_price: number;
  apply_date: string | null;
  created_id: number;
  created_date: string; // ISO format
  updated_id: number;
  updated_date: string; // ISO format
  id: number;
  author_nickname: string;
  episode_no: number;
  paid_yn: "Y" | "N";
  count_evaluation: number;
  count_total_sales: number;
  sum_total_sales_price: number;
  sales_price_per_count_hit: number;
  count_hit_in_24h: number;
  date: string; // e.g. "2024-12-04"
  episode_title: string;
  cp_company_name: string | null;
}

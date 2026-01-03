export interface IApplyRank {
  product_id: number;
  title: string;
  price_type: "paid" | "free";
  product_type: "normal" | "short" | string;
  status_code: string;
  ratings_code: "all" | "adult" | string;
  synopsis_text: string;

  user_id: number;
  author_id: number;
  author_name: string;
  illustrator_id: number;
  illustrator_name: string;

  publish_regular_yn: "Y" | "N";
  publish_days: string; // JSON string, e.g. '{"MON":"Y","TUE":"Y",...}'
  thumbnail_file_id: number;

  primary_genre_id: number;
  sub_genre_id: number;

  count_hit: number;
  count_cp_hit: number;
  count_recommend: number;
  count_bookmark: number;
  count_unbookmark: number;

  open_yn: "Y" | "N";
  approval_yn: "Y" | "N";
  monopoly_yn: "Y" | "N";
  contract_yn: "Y" | "N";

  paid_open_date: string; // e.g. "2024-08-01"
  paid_episode_no: number;
  last_episode_date: string;

  isbn: string;
  uci: string;

  single_regular_price: number;
  series_regular_price: number;
  sale_price: number;

  apply_date: string; // e.g. "2024-08-01"
  created_date: string; // ISO string
  updated_date: string;

  status: "review" | "accepted" | "denied" | string;
  type: "paid" | "free" | string;

  count_episode: number;
  apply_id: number;
}

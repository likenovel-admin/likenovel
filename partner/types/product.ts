export interface IProduct {
  product_id: number;
  title: string;
  author_nickname: string;
  count_episode: number;
  contract_type: string | null;
  cp_company_name: string | null;
  created_date: string; // ISO date string
  paid_open_date: string | null;
  isbn: string | null;
  uci: string | null;
  status_code: string;
  ratings_code: string;
  paid_yn: "Y" | "N";
  primary_genre: string | null;
  sub_genre: string | null;
  primary_genre_id: number | null;
  sub_genre_id: number | null;
  single_regular_price: number;
  series_regular_price: number;
  price_type: string;
  monopoly_yn: "Y" | "N";
  blind_yn: "Y" | "N";
  cp_author_profit: number;
  cp_contract_price: number;
}

export interface IProduct {
  product_id: number;
  title: string;
  synopsis?: string;
  author_nickname: string;
  author_user_id?: number | null;
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
  single_rental_price: number;
  series_regular_price: number;
  price_type: string;
  monopoly_yn: "Y" | "N";
  blind_yn: "Y" | "N";
  cp_author_profit: number;
  cp_contract_price: number;
  free_episode_start_no?: number | null;
  free_episode_end_no?: number | null;
  paid_episode_no?: number | null;
  product_type?: string | null;
  productType?: string | null;
  cover_image_path?: string | null;
  coverImagePath?: string | null;
  thumbnail_file_path?: string | null;
  thumbnailFilePath?: string | null;
}

import { IBadge } from "@/types";

export interface IGiftBookItem {
  id: number;
  user_id: number;
  ticket_type: string;
  own_type: string;
  read_yn: "Y" | "N";
  received_yn: "Y" | "N";
  received_date: string | null;
  expiration_date: string | null;
  reason: string;
  amount: number;
  acquisition_type: string;
  acquisition_id: number;
  promotion_type: string;
  ticket_expiration_type: string;
  ticket_expiration_value: number;
  created_id: number;
  created_date: string;
  updated_id: number | null;
  updated_date: string | null;

  product: {
    product_id: number;
    title: string;
    price_type: string;
    product_type: string;
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
    thumbnail_url: string;
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
    paid_open_date: string | null;
    paid_episode_no: number | null;
    last_episode_date: string | null;
    isbn: string | null;
    uci: string | null;
    single_regular_price: number;
    series_regular_price: number;
    sale_price: number;
    apply_date: string;
    created_id: number;
    created_date: string;
    updated_id: number;
    updated_date: string;
    badge:
      | (Omit<IBadge, "episodeUploadYn"> & { episodeUploadYn: boolean })
      | null;
  } | null;

  episode: number | null;
  event: number | null;
  quest: number | null;

  promotion: {
    id: number;
    product_id: number;
    type: string;
    status: string;
    start_date: string;
    num_of_ticket_per_person: number;
    promotion_category: string;
  } | null;
}

export interface IUserGiftBookHistoryItem {
  id: number;
  user_id: number;
  ticket_type: string;
  own_type: string;
  read_yn: "Y" | "N";
  received_yn: "Y" | "N";
  received_date: string | null;
  expiration_date: string | null;
  rental_expired_date: string | null;
  rental_remaining: number | null;
  reason: string;
  amount: number;
  acquisition_type: string;
  acquisition_id: number;
  promotion_type: string;
  ticket_expiration_type: string;
  ticket_expiration_value: number;
  created_id: number;
  created_date: string;
  updated_id: number | null;
  updated_date: string | null;

  product: {
    product_id: number;
    title: string;
    price_type: string;
    product_type: string;
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
    thumbnail_url: string;
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
    paid_open_date: string | null;
    paid_episode_no: number | null;
    last_episode_date: string | null;
    isbn: string | null;
    uci: string | null;
    single_regular_price: number;
    series_regular_price: number;
    sale_price: number;
    apply_date: string;
    created_id: number;
    created_date: string;
    updated_id: number;
    updated_date: string;
    badge:
      | (Omit<IBadge, "episodeUploadYn"> & { episodeUploadYn: boolean })
      | null;
  } | null;

  episode: number | null;
  event: number | null;
  quest: number | null;

  promotion: {
    id: number;
    product_id: number;
    type: string;
    status: string;
    start_date: string;
    num_of_ticket_per_person: number;
    promotion_category: string;
  } | null;
}

export interface SelectUserGiftBookResponse {
  data: IGiftBookItem[];
}

export interface SelectUserGiftBookHistoryResponse {
  data: IUserGiftBookHistoryItem[];
}

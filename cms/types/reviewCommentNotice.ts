export interface IReview {
  id: number;
  product_id: number;
  episode_id: number;
  nickname: string;
  user_name: string;
  email: string;
  product_title: string;
  user_id: number;
  review_text: string;
  use_yn: string;
  open_yn: string;
  created_date: string;
  updated_date: string;
}

export interface IReviewDetail {
  id: number;
  product_id: number;
  episode_id: number;
  user_id: number;
  review_text: string;
  created_id: number;
  created_date: string; // ISO date string
  updated_id: number;
  updated_date: string; // ISO date string
  title: string;
  price_type: "free" | "paid" | string; // Adjust if more types are known
  product_type: string | null;
  status_code: string;
  ratings_code: string;
  synopsis_text: string;
  author_id: number;
  author_name: string;
  illustrator_id: number | null;
  illustrator_name: string | null;
  publish_regular_yn: "Y" | "N";
  publish_days: {
    [day: string]: "Y" | "N"; // e.g., { "MON": "Y" }
  };
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
  paid_open_date: string | null;
  paid_episode_no: number | null;
  last_episode_date: string; // ISO date string
  isbn: string | null;
  uci: string | null;
  single_regular_price: number;
  series_regular_price: number;
  sale_price: number;
  apply_date: string | null;
  kc_user_id: string;
  email: string;
  gender: "M" | "F" | string;
  birthdate: string; // ISO date string
  user_name: string | null;
  identity_yn: "Y" | "N";
  agree_terms_yn: "Y" | "N";
  agree_privacy_yn: "Y" | "N";
  agree_age_limit_yn: "Y" | "N";
  stay_signed_yn: "Y" | "N";
  latest_signed_date: string; // ISO date string
  latest_signed_type: string;
  use_yn: "Y" | "N";
  role_type: string;
  nickname: string;
  product_title: string;
}

export interface IComment {
  comment_id: number;
  product_id: number;
  episode_id: number;
  user_id: number;
  profile_id: number;
  author_recommend_yn: "Y" | "N";
  content: string;
  count_recommend: number;
  count_not_recommend: number;
  use_yn: "Y" | "";
  display_top_yn: "Y" | "N";
  created_id: number;
  created_date: string; // ISO 8601 date string
  updated_id: number;
  updated_date: string; // ISO 8601 date string

  // Product Info
  title: string;
  price_type: "free" | "paid" | string;
  product_type: string | null;
  status_code: string;
  ratings_code: string;
  synopsis_text: string;
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
  count_bookmark: number;
  count_unbookmark: number;
  open_yn: "Y" | "";
  approval_yn: "Y" | "";
  monopoly_yn: "Y" | "";
  contract_yn: "Y" | "";
  paid_open_date: string | null;
  paid_episode_no: number | null;
  last_episode_date: string; // ISO 8601

  isbn: string | null;
  uci: string | null;
  single_regular_price: number;
  series_regular_price: number;
  sale_price: number;
  apply_date: string | null;

  // User Info
  kc_user_id: string;
  email: string;
  gender: "M" | "F" | string;
  birthdate: string; // ISO 8601
  user_name: string | null;
  identity_yn: "Y" | "";
  agree_terms_yn: "Y" | "N";
  agree_privacy_yn: "Y" | "N";
  agree_age_limit_yn: "Y" | "N";
  stay_signed_yn: "Y" | "N";
  latest_signed_date: string; // ISO 8601
  latest_signed_type: string;
  role_type: string;
  nickname: string;

  product_title: string;
}

export interface ICommentInList {
  type: "comment";
  id: string;
  product_id: number;
  user_id: number;
  use_yn: string;
  open_yn: string;
  contents: string;
  created_date: string;
  user_name: string;
  product_title: string;
}

export interface INotice {
  id: number;
  product_id: number;
  user_id: number;
  nickname: string;
  email: string;
  user_name: string;
  product_title: string;
  subject: string;
  content: string;
  open_yn: string;
  use_yn: string;
  notice_open_yn: string;
  created_date: string;
  updated_date: string;
}

export interface INoticeInList {
  type: "notice";
  id: number;
  product_id: number;
  user_id: number;
  use_yn: string;
  open_yn: string;
  created_date: string;
  contents: string;
  user_name: string;
  product_title: string;
}

export interface IReviewInList {
  type: "review";
  id: number;
  product_id: number;
  user_id: number;
  use_yn: string;
  open_yn: string;
  created_date: string;
  contents: string;
  user_name: string;
  product_title: string;
}

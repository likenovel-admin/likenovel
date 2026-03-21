import { IGenre } from "@/types/genre";
import { IProduct } from "@/types/product";

export interface IGetProductsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IProduct[];
}

export interface IGetProductParams {
  contract_type?: string;
  page?: number;
  count_per_page?: number;
  status_code?: string;
  has_episode_apply_yn?: "Y" | "N" | "";
  search_target?: string;
  search_word?: string;
  start_date?: string;
  end_date?: string;
  from_episode_sales_page?: number;
}

export type TUpdateFrequency =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export interface ICreateProductRequest {
  cover_image_file_id?: number;
  ongoing_state: "ongoing" | "rest" | "end" | "stop";
  title: string;
  author_nickname: string;
  illustrator_nickname?: string | null;
  update_frequency: TUpdateFrequency[];
  publish_regular_yn: "Y" | "N";
  primary_genre: string;
  sub_genre?: string | null;
  keywords?: string[] | null;
  custom_keywords?: string[] | null;
  synopsis: string;
  adult_yn: "Y" | "N";
  open_yn: "Y" | "N";
  blind_yn?: "Y" | "N";
  monopoly_yn: "Y" | "N";
  cp_contract_yn: "Y" | "N";
  series_regular_price?: number;
  single_regular_price?: number;
  single_rental_price?: number;
}

export interface ICreateProductResponse {
  data?: {
    product_id?: number;
  };
}

export interface IUpdateProductRequest {
  author_nickname?: string;
  cover_image_file_id?: number;
  title?: string;
  synopsis?: string;
  ratings_code?: string;
  primary_genre_id?: number;
  sub_genre_id?: number;
  status_code?: string;
  uci?: string;
  isbn?: string;
  series_regular_price?: number;
  single_regular_price?: number;
  single_rental_price?: number;
  cp_company_name?: string;
  cp_id?: number;
  monopoly_yn?: "Y" | "N";
  open_yn?: "Y" | "N";
  blind_yn?: "Y" | "N";
  cp_offered_price?: number;
  cp_settlement_rate?: number;
  cp_author_profit?: number;
  cp_contract_price?: number;
  free_episode_start_no?: number | null;
  free_episode_end_no?: number | null;
}

export interface IUpdateProductResponse {
  data: {
    message: string;
  };
}

export type IGetProductDetailResponse = IProduct;

export type IGetProductGenreResponse = IGenre[];

export type IGetCPCompanyResponse = {
  company_name: string;
}[];

export type EpisodeApplyStatusCode = "review" | "accepted" | "denied" | "cancel";

export interface IProductDetailsGroupEpisode {
  episodeId: number;
  productId: number;
  episodeNo: number;
  episodeTitle: string;
  episodeVersion?: number | null;
  latestApplyId?: number | null;
  latestApplyStatus?: EpisodeApplyStatusCode | null;
  priceType?: string;
  openYn?: "Y" | "N";
  episodeOpenYn?: "Y" | "N";
  useYn?: "Y" | "N";
  reviewYn?: "Y" | "N";
  publishReserveDate?: string | null;
  createdDate?: string | null;
  epubFilePath?: string | null;
  epubFileName?: string | null;
}

export interface IProductDetailsGroupResponse {
  data: {
    product: Record<string, unknown>;
    episodes: IProductDetailsGroupEpisode[];
    evaluations?: Record<string, unknown>;
    notices?: unknown[];
  };
}

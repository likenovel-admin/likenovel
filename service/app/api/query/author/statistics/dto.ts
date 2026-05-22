export interface IAuthorProductDetailFunnelRow {
  detail_entry_date: string;
  product_id: number;
  entry_source: string | null;
  detail_view_raw_count: number;
  detail_view_session_count: number;
  detail_view_user_count: number;
  detail_to_view_session_count: number;
  detail_to_view_user_count: number;
  detail_exit_session_count: number;
  exit_home_session_count: number;
  exit_search_session_count: number;
  exit_other_product_detail_session_count: number;
  exit_other_route_session_count: number;
  episode_exit_event_count: number;
  avg_episode_exit_progress_ratio: number | null;
  created_date: string;
  updated_date: string;
}

export interface IAuthorProductDetailFunnelResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAuthorProductDetailFunnelRow[];
}

export interface IAuthorProductDetailFunnelParams {
  productId?: number;
  startDate: string;
  endDate: string;
  page?: number;
  countPerPage?: number;
  enabled?: boolean;
}

export interface IAuthorProductEpisodeDropoffRow {
  product_id: number;
  episode_id: number;
  episode_no: number;
  episode_title: string | null;
  read_start_count: number;
  episode_dropoff_count: number;
  episode_dropoff_rate: number;
  avg_dropoff_progress_ratio: number | null;
  near_complete_count: number;
  dropoff_0_10_count: number;
  dropoff_10_30_count: number;
  dropoff_30_60_count: number;
  dropoff_60_90_count: number;
  dropoff_90_plus_count: number;
}

export interface IAuthorProductEpisodeDropoffResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAuthorProductEpisodeDropoffRow[];
}

export interface IAuthorProductEpisodeDropoffParams {
  productId?: number;
  startDate: string;
  endDate: string;
  page?: number;
  countPerPage?: number;
  enabled?: boolean;
}

export type AuthorRecent24hRankStatus =
  | "reflected"
  | "pending"
  | "excluded"
  | "not_ready"
  | string;

export interface IAuthorProductRecent24hEpisodeRow {
  episodeId: number;
  episodeNo: number;
  episodeTitle: string | null;
  recent24hCountHit: number;
  cumulativeCountHit: number;
  shareRate: number | null;
}

export interface IAuthorProductRecent24hHourlyRow {
  hourLabel: string;
  countHit: number;
}

export interface IAuthorProductRecent24hSummary {
  recent24hCountHit: number | null;
  previous24hCountHit: number | null;
  cumulativeCountHit: number;
  rankStatus: AuthorRecent24hRankStatus;
  rankBasisAt: string | null;
}

export interface IAuthorProductRecent24hResponse {
  productId: number;
  basisAt: string | null;
  fromAt: string | null;
  toAt: string | null;
  totalEpisodeCount: number;
  summary: IAuthorProductRecent24hSummary;
  hourly: IAuthorProductRecent24hHourlyRow[];
  episodes: IAuthorProductRecent24hEpisodeRow[];
}

export interface IAuthorProductRecent24hParams {
  productId?: number;
  enabled?: boolean;
}

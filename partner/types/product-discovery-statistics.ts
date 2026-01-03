export interface IProductDiscoveryStatistics {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  count_episode: number;
  count_hit: number;
  count_hit_per_episode: number;
  count_read_user: number;
  count_bookmark: number;
  count_unbookmark: number;
  count_recommend: number;
  count_evaluation: number;
  count_cp_hit: number;
  reading_rate: number;
  writing_count_per_week: number;
  count_interest_sustain: number;
  count_interest_loss: number;
  primary_reader_group1: string;
  primary_reader_group2: string | null;
  primary_genre: string;
  sub_genre: string | null;
  score1: number;
  score2: number;
  score3: number;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  cover_image_path: string;
}

export interface ReadingRateTrend {
  date: string;
  reading_rate: number;
}

export interface BookmarkTrend {
  date: string;
  count_bookmark: number;
  count_unbookmark: number;
}

export interface InterestTrend {
  date: string;
  count_interest_sustain: number;
  count_interest_loss: number;
}

export interface EpisodeCountHit {
  episode_no: number;
  episode_title: string;
  count_hit: number;
}

export interface SimilarProduct {
  product_id: number;
  title: string;
}

export interface ReaderAnalysis {
  user_type: string;
  percent: number;
}

export interface IProductDiscoveryStatisticsDetail {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  count_episode: number;
  count_hit: number;
  count_hit_per_episode: number;
  count_read_user: number;
  count_bookmark: number;
  count_unbookmark: number;
  count_recommend: number;
  count_evaluation: number;
  count_cp_hit: number;
  reading_rate: number;
  writing_count_per_week: number;
  count_interest_sustain: number;
  count_interest_loss: number;
  primary_reader_group1: string;
  primary_reader_group2: string;
  primary_genre: string;
  sub_genre: string | null;
  score1: number;
  score2: number;
  score3: number;
  created_id: number;
  created_date: string; // ISO date
  updated_id: number;
  updated_date: string; // ISO date
  weight_count_hit: number;
  weight_evaluation_score: number;
  evaluation_score: number;
  evaluation_yn: string;
  excavation_value: string;
  active_reader_rate: number;
  reader_preference_rate: number;
  advance_tax_proposal_scope: number[];
  serial_integrity: number;
  new_reader_inflow_rate: number;
  reading_rate_trends: ReadingRateTrend[];
  bookmark_trends: BookmarkTrend[];
  interest_trends: InterestTrend[];
  first_episode_count_hit_in_24h: number;
  latest_episode_count_hit_in_24h: number;
  episode_count_hit: EpisodeCountHit[];
  reader_analysis: ReaderAnalysis[]; // Empty array, you can replace `any` if type is known
  similar_product_1: SimilarProduct;
  similar_product_2: SimilarProduct;
  similar_product_3: SimilarProduct;
}

import {
  IAlgorithmSection,
  IAlgorithmSetTopic,
  IAlgorithmSimilar,
  IAlgorithmUser,
} from "@/types/algorithm";

export interface IGetAlgorithmUserResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAlgorithmUser[];
}

export interface IGetAlgorithmSetTopicResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAlgorithmSetTopic[];
}

export interface IGetAlgorithmSectionsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAlgorithmSection[];
}

export interface IGetAlgorithmSimilarResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IAlgorithmSimilar[];
  latest_updated_date: string;
}

export interface IGetAlgorithmParams {
  type?: string;
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export interface IUpdateAlgorithmSectionRequest {
  position?: string;
  feature: string;
}

export interface IUpdateAlgorithmSectionResponse {
  data: {
    message: string;
  };
}

export interface IUpdateAlgorithmSetTopicRequest {
  title: string;
}

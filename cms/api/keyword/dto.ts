import { ICategory, IKeyword } from "@/types/keyword";

export interface IGetKeywordResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IKeyword[];
}

export interface IGetKeywordParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  status?: string;
}

export type IGetKeywordCategoriesResponse = ICategory[];

export interface IKeywordRequest {
  keyword_name: string;
  category_id: number;
}

export interface IAddEditKeywordResponse {
  data: {
    message: string;
  };
}

export interface IDeleteKeywordResponse {
  data: {
    message: string;
  };
}

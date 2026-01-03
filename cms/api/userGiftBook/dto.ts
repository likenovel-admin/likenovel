import { HistoryEntry, IUserGiftBook } from "@/types/userGiftbook";

export interface IGetUserGiftBookResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IUserGiftBook[];
}

export interface IGetUserGiftBookParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export type IGetUserGiftBookDownloadResponse = HistoryEntry;

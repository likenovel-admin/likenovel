import { IMessage } from "@/types/message";

export interface IGetMessageResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMessage[];
}

export interface IGetMessageParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
}

export type IGetMessageDownloadResponse = IMessage[];

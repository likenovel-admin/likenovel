import { IDailyTicket } from "@/types/daily-ticket";

export interface IGetDailyTicketsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IDailyTicket[];
}

export interface IGetDailyTicketParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

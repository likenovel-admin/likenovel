import { ISponsorshipRecode } from "@/types/sponsorship-recodes";

export interface IGetSponsorshipRecodesResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: ISponsorshipRecode[];
}

export interface IGetSponsorshipRecodeParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

export interface ISponsorshipSettlementResponse {
  data: {
    message: string;
  };
}

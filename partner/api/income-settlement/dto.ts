import {
  IIncomeSettlement,
  IIncomeSettlementSummary,
} from "@/types/income-settlement";

export interface IGetIncomeSettlementsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IIncomeSettlement[];
}

export interface IGetIncomeSettlementParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  search_start_date?: string;
  search_end_date?: string;
}

export type IGetIncomeSettlementSummaryResponse = IIncomeSettlementSummary;

export interface IRequestSponsorshipSettlementBody {
  account_holder: string;
  bank_name: string;
  account_number: string;
  resident_registration_number: string;
}

export interface IRequestSponsorshipSettlementResponse {
  data: {
    requested: boolean;
    request_month: string;
    requestable_amount: number;
    total_donation: number;
    confirmed_final: number;
  };
}

export interface ISponsorshipSettlementEligibility {
  min_amount: number;
  requestable_amount: number;
  confirmed_final: number;
  requested_this_month: boolean;
  can_request: boolean;
}

export interface IGetSponsorshipSettlementEligibilityResponse {
  data: ISponsorshipSettlementEligibility;
}

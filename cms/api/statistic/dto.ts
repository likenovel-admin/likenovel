import {
  IStatisticSitePageReferrer,
  IStatisticSitePageReferrerSummary,
  IStatisticSitePageRoute,
  IStatisticSitePageRouteSummary,
  IStatisticSite,
  IStatisticPayment,
  IStatisticPaymentByUser,
  IStatisticWebsochatModelSummary,
  IStatisticWebsochatProductSummary,
  IStatisticWebsochatRouteSummary,
  IStatisticWebsochatUsage,
  IStatisticWebsochatUsageSummary,
  IStatisticAiReaderAgentAction,
  IStatisticAiReaderCohort,
  IStatisticAiReaderError,
  IStatisticAiReaderHourly,
  IStatisticAiReaderProduct,
  IStatisticAiReaderRecentAction,
  IStatisticAiReaderSummary,
  IStatisticAiReaderTimelineAction,
  IStatisticAiApiUsageModel,
  IStatisticAiProviderHealth,
  IStatisticAiApiUsageSource,
  IStatisticAiApiUsageSummary,
} from "@/types/statistic";

export interface IGetStatisticSiteResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticSite[];
}

export interface IGetStatisticSiteAllResponse {
  data: IStatisticSite[];
}

export interface IGetStatisticSiteParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticSitePageRoutesResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  summary: IStatisticSitePageRouteSummary;
  results: IStatisticSitePageRoute[];
}

export interface IGetStatisticSitePageRoutesParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  route_group?: string;
}

export interface IGetStatisticSitePageReferrersResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  summary: IStatisticSitePageReferrerSummary;
  results: IStatisticSitePageReferrer[];
}

export interface IGetStatisticSitePageReferrersParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  referrer_group?: string;
  route_group?: string;
  traffic_signal?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface IGetStatisticPaymentResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticPayment[];
}

export interface IGetStatisticPaymentAllResponse {
  data: IStatisticPayment[];
}

export interface IGetStatisticPaymentParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticPaymentByUserResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IStatisticPaymentByUser[];
}

export interface IGetStatisticPaymentByUserAllResponse {
  data: IStatisticPaymentByUser[];
}

export interface IGetStatisticPaymentByUserParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  search_target?: string;
  search_word?: string;
}

export interface IGetStatisticWebsochatUsageResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  summary: IStatisticWebsochatUsageSummary;
  model_summary: IStatisticWebsochatModelSummary[];
  route_summary: IStatisticWebsochatRouteSummary[];
  product_summary: IStatisticWebsochatProductSummary[];
  results: IStatisticWebsochatUsage[];
}

export interface IGetStatisticWebsochatUsageParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  search_target?: string;
  search_word?: string;
  product_id?: number;
  model_used?: string;
  route_mode?: string;
  fallback_used?: string;
}

export interface IGetStatisticAiReaderEngagementResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  summary: IStatisticAiReaderSummary;
  hourly_summary: IStatisticAiReaderHourly[];
  cohort_summary: IStatisticAiReaderCohort[];
  recent_errors: IStatisticAiReaderError[];
  recent_actions: IStatisticAiReaderRecentAction[];
  results: IStatisticAiReaderProduct[];
}

export interface IGetStatisticAiReaderEngagementParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticAiReaderAgentActionsParams {
  agent_id: number;
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticAiReaderAgentActionsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  items: IStatisticAiReaderAgentAction[];
}

export interface IGetStatisticAiReaderTimelineParams {
  page?: number;
  count_per_page?: number;
  start_date?: string;
  end_date?: string;
  status_filter?: "applied" | "pending" | "skipped" | "failed" | "all";
}

export interface IGetStatisticAiReaderTimelineResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  items: IStatisticAiReaderTimelineAction[];
}

export interface IGetStatisticAiApiUsageParams {
  start_date?: string;
  end_date?: string;
}

export interface IGetStatisticAiApiUsageResponse {
  summary: IStatisticAiApiUsageSummary;
  results: IStatisticAiApiUsageSource[];
  model_summary: IStatisticAiApiUsageModel[];
  provider_health: IStatisticAiProviderHealth[];
}

export interface IGetStatisticAiProviderHealthResponse {
  results: IStatisticAiProviderHealth[];
}

export interface IPostStatisticAiProviderHealthCheckResponse {
  results: IStatisticAiProviderHealth[];
}

export interface IStatisticSite {
  DAU: number;
  MAU: number;
  date: string;
  login_count: number;
  page_view: number;
  signin_count: number;
  signoff_count: number;
  visitors: number;
}

export interface IStatisticSitePageRouteSummary {
  page_view_count: number;
  visitor_count: number;
  session_count: number;
  dwell_event_count: number;
  active_dwell_total_ms: number;
  active_dwell_avg_ms: number;
  short_dwell_count: number;
}

export interface IStatisticSitePageRoute {
  route_group: string;
  route_name: string;
  path_template: string;
  page_view_count: number;
  visitor_count: number;
  session_count: number;
  dwell_event_count: number;
  active_dwell_total_ms: number;
  active_dwell_avg_ms: number;
  short_dwell_count: number;
}

export interface IStatisticSitePageReferrerSummary {
  page_view_count: number;
  visitor_count: number;
  session_count: number;
}

export interface IStatisticSitePageReferrer {
  referrer_group: string;
  external_referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  route_group: string;
  route_name: string;
  path_template: string;
  landing_path: string;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  page_view_count: number;
  visitor_count: number;
  session_count: number;
}

export interface IStatisticPayment {
  date: string;
  pay_count: number;
  pay_coin: number;
  pay_amount: number;
  use_coin_count: number;
  use_coin: number;
  donation_count: number;
  donation_coin: number;
  ad_revenue: number;
}

export interface IStatisticPaymentByUser {
  date: string;
  order_datetime?: string;
  orderDatetime?: string;
  order_no?: string | number;
  orderNo?: string | number;
  user_id?: number;
  userId?: number;
  email: string;
  nickname: string;
  pay_count: number;
  pay_coin: number;
  pay_amount: number;
  use_coin_count: number;
  use_coin: number;
  donation_count: number;
  donation_coin: number;
  ad_revenue: number;
  cash_order_id?: number | null;
  cashOrderId?: number | null;
  cash_order_count?: number;
  cashOrderCount?: number;
}

export interface IStatisticWebsochatUsageSummary {
  total_turn_count: number;
  session_count: number;
  product_count: number;
  user_count: number;
  charged_turn_count: number;
  charged_cash: number;
  fallback_count: number;
}

export interface IStatisticWebsochatModelSummary {
  model_used: string;
  turn_count: number;
  charged_cash: number;
  fallback_count: number;
}

export interface IStatisticWebsochatRouteSummary {
  route_mode: string;
  turn_count: number;
  charged_cash: number;
}

export interface IStatisticWebsochatProductSummary {
  product_id: number;
  product_title: string;
  turn_count: number;
  session_count: number;
  charged_cash: number;
}

export interface IStatisticWebsochatUsage {
  usage_log_id: number;
  session_id: number;
  product_id: number;
  product_title: string;
  session_title: string;
  user_id?: number | null;
  email?: string | null;
  nickname?: string | null;
  guest_key?: string | null;
  model_used: string;
  route_mode: string;
  intent?: string | null;
  fallback_used: "Y" | "N";
  charged_cash: number;
  created_date: string;
}

export interface IStatisticAiReaderSummary {
  total_agent_count: number;
  active_agent_count: number;
  paused_agent_count: number;
  available_paused_agent_count: number;
  scheduled_active_agent_count: number;
  idle_active_agent_count: number;
  available_idle_active_agent_count: number;
  created_agent_count: number;
  today_schedule_count: number;
  open_schedule_count: number;
  failed_schedule_count: number;
  decision_count: number;
  success_decision_count: number;
  failed_decision_count: number;
  pending_decision_count: number;
  queued_action_count: number;
  running_action_count: number;
  failed_action_count: number;
  skipped_action_count: number;
  applied_action_count: number;
  ai_view_count: number;
  ai_bookmark_count: number;
  ai_unbookmark_count: number;
  ai_recommend_count: number;
  ai_unrecommend_count: number;
  ai_evaluation_count: number;
  drop_count: number;
}

export interface IStatisticAiReaderProduct {
  product_id: number;
  product_title: string;
  ai_view_count: number;
  ai_bookmark_count: number;
  ai_unbookmark_count: number;
  ai_recommend_count: number;
  ai_unrecommend_count: number;
  ai_evaluation_count: number;
  ai_view_action_count: number;
  ai_bookmark_add_action_count: number;
  ai_bookmark_remove_action_count: number;
  ai_bookmark_net_action_count: number;
  ai_recommend_add_action_count: number;
  ai_recommend_remove_action_count: number;
  ai_recommend_net_action_count: number;
  ai_evaluation_action_count: number;
  last_ai_action_at: string | null;
  drop_count: number;
  public_view_count: number;
  public_bookmark_count: number;
  public_recommend_count: number;
  public_evaluation_count: number;
  ai_popularity_score: number;
}

export interface IStatisticAiReaderHourly {
  hour: number;
  read_count: number;
  bookmark_count: number;
  unbookmark_count: number;
  recommend_count: number;
  unrecommend_count: number;
  evaluation_count: number;
  drop_count: number;
}

export interface IStatisticAiReaderCohort {
  age_group: string;
  gender: string;
  read_count: number;
  bookmark_count: number;
  unbookmark_count: number;
  recommend_count: number;
  unrecommend_count: number;
  evaluation_count: number;
  drop_count: number;
}

export interface IStatisticAiReaderAgentAction {
  ai_reader_action_id: number;
  ai_reader_agent_id: number;
  product_id: number;
  episode_id: number | null;
  action_type: string;
  target_value: string | null;
  status: string;
  applied_at: string | null;
  created_date: string;
  updated_date: string;
  error_message: string | null;
}

export interface IStatisticAiReaderTimelineAction {
  ai_reader_action_id: number;
  ai_reader_agent_id: number;
  agent_key: string;
  age_group: string | null;
  gender: string | null;
  product_id: number;
  product_title: string | null;
  episode_id: number | null;
  action_type: string;
  target_value: string | null;
  status: string;
  event_time: string;
  applied_at: string | null;
  created_date: string;
  updated_date: string;
  error_message: string | null;
}

export interface IStatisticAiReaderRecentAction {
  ai_reader_action_id: number;
  ai_reader_agent_id: number;
  agent_key: string;
  age_group: string | null;
  gender: string | null;
  product_id: number;
  product_title: string | null;
  episode_id: number | null;
  action_type: string;
  target_value: string | null;
  status: string;
  applied_at: string | null;
  created_date: string;
}

export interface IStatisticAiReaderError {
  event_time: string;
  source: string;
  ai_reader_agent_id?: number | null;
  product_id?: number | null;
  action_type?: string | null;
  model_name?: string | null;
  error_message?: string | null;
}

export interface IStatisticAiApiUsageSummary {
  request_count: number;
  success_count: number;
  failure_count: number;
  exact_cost_usd: number;
  estimated_cost_usd: number;
  tracked_cost_usd: number;
  untracked_count: number;
  charged_cash: number;
}

export interface IStatisticAiApiUsageSource {
  source_key: string;
  source_label: string;
  request_count: number;
  success_count: number;
  failure_count: number;
  exact_cost_usd: number;
  estimated_cost_usd: number;
  untracked_count: number;
  charged_cash: number;
}

export interface IStatisticAiApiUsageModel {
  provider: string;
  model_name: string;
  source_key: string;
  request_count: number;
  exact_cost_usd: number;
  estimated_cost_usd: number;
  untracked_count: number;
}

export interface IStatisticAiProviderHealth {
  provider: string;
  model: string | null;
  status: string;
  http_status: number | null;
  error_code: string | null;
  error_message: string | null;
  latency_ms: number | null;
  checked_at: string | null;
  success_at: string | null;
  last_success_at: string | null;
  affected_features: string | null;
}

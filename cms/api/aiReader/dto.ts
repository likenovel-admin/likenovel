export interface IAiReaderScheduleWindow {
  active_start_at: string;
  active_end_at: string;
  session_budget: number;
  used_session_count?: number;
  status?: string;
}

export interface IAiReaderAgent {
  ai_reader_agent_id: number;
  agent_key: string;
  user_id: number;
  email?: string;
  age_group: string;
  gender: string;
  active_hours: number[];
  daily_session_target?: number;
  daily_llm_budget: number;
  status: string;
  schedule_session_budget?: number;
  used_session_count?: number;
  schedule_window_count?: number;
  first_active_start_at?: string | null;
  last_active_end_at?: string | null;
  schedules?: IAiReaderScheduleWindow[];
}

export interface IGetAiReaderAgentsParams {
  schedule_date?: string;
  status?: string;
  page?: number;
  count_per_page?: number;
}

export interface IGetAiReaderAgentsResponse {
  schedule_date: string;
  total_count: number;
  page: number;
  count_per_page: number;
  items: IAiReaderAgent[];
}

export interface IAiReaderImmediateSchedulePreview {
  active_start_at: string;
  active_end_at: string;
  agent_count: number;
}

export interface IAiReaderTimeBlock {
  label?: string;
  start_hour: number;
  end_hour: number;
  sessions_per_agent?: number;
}

export interface IAiReaderBootstrapRequest {
  email_prefix: string;
  agent_count: number;
  schedule_date?: string;
  schedule_duration_days?: number;
  apply: boolean;
  allow_partial?: boolean;
  auto_provision_missing_users?: boolean;
  agent_index_offset?: number;
  daily_llm_budget?: number;
  active_hours?: number[];
  daily_session_target?: number;
  time_blocks?: IAiReaderTimeBlock[];
  product_type_weights?: Record<string, number>;
  free_product_type_weights?: Record<string, number>;
  start_immediately?: boolean;
  immediate_batch_size?: number;
  immediate_batch_interval_minutes?: number;
  immediate_schedule_start_at?: string;
  age_group_ratios?: Record<string, number>;
  gender_ratios?: Record<string, number>;
  profile_nickname_pool?: string[];
  dry_run_token?: string;
}

export interface IAiReaderBootstrapResponse {
  applied: boolean;
  schedule_date: string;
  schedule_duration_days?: number;
  schedule_end_date?: string;
  requested_count: number;
  available_user_count?: number;
  missing_user_count?: number;
  provisioned_user_count?: number;
  dry_run_token?: string;
  applied_count?: number;
  schedule_count?: number;
  immediate_schedule_preview?: IAiReaderImmediateSchedulePreview[];
  immediate_schedule_start_at?: string | null;
  preview?: Array<{
    user_id: number;
    email: string;
    agent_key: string;
    age_group: string;
    gender: string;
    activity_pattern?: Record<string, unknown>;
  }>;
}

export interface IAiReaderScheduleRequest {
  schedule_date?: string;
  active_hours: number[];
  daily_session_target: number;
  time_blocks?: IAiReaderTimeBlock[];
  daily_llm_budget?: number;
  status?: "active" | "paused";
  replace_running?: boolean;
}

export interface IAiReaderScheduleResponse {
  schedule_date: string;
  agent: IAiReaderAgent;
  schedule_count: number;
  deleted_schedule_count: number;
  upserted_schedule_count: number;
  schedules: IAiReaderScheduleWindow[];
}

export interface IAiReaderPauseAllResponse {
  paused_agent_count: number;
  retired_schedule_count: number;
  cancelled_action_count: number;
}

export interface IAiReaderResumePausedRequest {
  agent_count: number;
  schedule_date?: string;
  schedule_duration_days?: number;
  apply: boolean;
  start_immediately?: boolean;
  immediate_batch_size?: number;
  immediate_batch_interval_minutes?: number;
  immediate_schedule_start_at?: string;
  active_hours?: number[];
  daily_session_target?: number;
  time_blocks?: IAiReaderTimeBlock[];
  product_type_weights?: Record<string, number>;
  free_product_type_weights?: Record<string, number>;
  daily_llm_budget?: number;
  dry_run_token?: string;
}

export interface IAiReaderResumePausedResponse {
  applied: boolean;
  schedule_date: string;
  schedule_duration_days?: number;
  schedule_end_date?: string;
  requested_count: number;
  available_agent_count: number;
  missing_agent_count?: number;
  dry_run_token?: string;
  reactivated_agent_count?: number;
  retired_schedule_count?: number;
  deleted_schedule_count?: number;
  schedule_count?: number;
  immediate_schedule_preview?: IAiReaderImmediateSchedulePreview[];
  immediate_schedule_start_at?: string | null;
  preview?: Array<{
    ai_reader_agent_id: number;
    user_id: number;
    agent_key: string;
    age_group: string;
    gender: string;
    daily_llm_budget: number;
    activity_pattern?: Record<string, unknown>;
  }>;
}

export interface IAiReaderRefreshSchedulesRequest extends IAiReaderResumePausedRequest {}

export interface IAiReaderRefreshSchedulesResponse extends Omit<
  IAiReaderResumePausedResponse,
  "reactivated_agent_count"
> {
  refreshed_agent_count?: number;
}

export interface IAiReaderRestartRequest extends IAiReaderResumePausedRequest {}

export interface IAiReaderRestartResponse extends Omit<
  IAiReaderResumePausedResponse,
  "reactivated_agent_count"
> {
  restarted_agent_count?: number;
  paused_agent_count?: number;
  cancelled_action_count?: number;
}

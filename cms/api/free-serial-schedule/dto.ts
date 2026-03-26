export interface IFreeSerialScheduleRow {
  row: number;
  product_id: number | null;
  sheet_title: string;
  title: string;
  start_episode_no: number | null;
  schedule_start_date: string;
  schedule_time: string;
  interval_days: number | null;
  overwrite_future_reserved: "Y" | "N";
  excluded_episode_nos: number[];
  total_episode_count: number;
  matched_episode_count: number;
  apply_target_count: number;
  new_reservation_count: number;
  overwrite_reservation_count: number;
  skipped_count: number;
  skip_reason_counts: Record<string, number>;
  first_schedule_at: string | null;
  last_schedule_at: string | null;
  errors: string[];
}

export interface IFreeSerialScheduleSummary {
  row_count: number;
  error_row_count: number;
  matched_episode_count: number;
  apply_target_count: number;
  new_reservation_count: number;
  overwrite_reservation_count: number;
  skipped_count: number;
}

export interface IFreeSerialScheduleResponse {
  success: boolean;
  message: string;
  summary: IFreeSerialScheduleSummary | null;
  results: IFreeSerialScheduleRow[];
}

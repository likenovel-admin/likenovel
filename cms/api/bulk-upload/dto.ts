export interface IBulkUploadPreviewItem {
  row: number;
  email: string;
  nickname: string;
  title: string;
  genre1: string;
  genre2: string;
  tags: string;
  rating: string;
  monopoly: string;
  contract: string;
  open_yn: string;
  synopsis: string;
  schedule_days: string;
  first_open_ep: number;
  start_date: string;
  episode_count: number;
  account_exists: boolean;
  errors: string[];
}

export interface IBulkUploadPreviewResponse {
  error: string | null;
  results: IBulkUploadPreviewItem[];
}

export interface IBulkUploadExecuteResult extends IBulkUploadPreviewItem {
  status: "created" | "skipped" | "failed";
  message?: string;
  user_id?: number;
  product_id?: number;
  episodes_created?: number;
}

export interface IBulkUploadExecuteResponse {
  success: boolean;
  message: string;
  results: IBulkUploadExecuteResult[];
}

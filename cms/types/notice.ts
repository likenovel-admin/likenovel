export interface INotice {
  id: number;
  subject: string;
  content: string;
  primary_yn: "Y" | "N";
  use_yn: "Y" | "N";
  view_count: number;
  file_id: number | null;
  created_id: number | null;
  created_date: string;
  updated_id: number | null;
  updated_date: string;
  file_path: string | null;
  file_name: string | null;
  top_bar_yn?: "Y" | "N";
  top_bar_text?: string | null;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
}

export interface INoticeDetail {
  id: number;
  subject: string;
  content: string;
  primary_yn: "Y" | "N";
  use_yn: "Y" | "N";
  view_count: number;
  file_id: number;
  created_id: number;
  created_date: string; // ISO date string
  updated_id: number | null;
  updated_date: string;
  file_path: string;
  file_name: string;
  top_bar_yn?: "Y" | "N";
  top_bar_text?: string | null;
  top_bar_start_date?: string | null;
  top_bar_end_date?: string | null;
}

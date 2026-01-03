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
}

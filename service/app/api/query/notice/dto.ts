import { IRollingNotice } from "@/types";

export interface SelectRollingNoticeResponse {
  data: IRollingNotice[];
}

export interface INotice {
  id: number;
  subject: string;
  content: string;
  primary_yn: "Y" | "N";
  use_yn: "Y" | "N";
  view_count: number;
  created_date: string;
  updated_date: string | null;
}

export interface SelectNoticesResponse {
  data: INotice[];
  totalItems: number;
}

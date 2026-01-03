export interface IFaq {
  id: number;
  faq_type: string;
  subject: string;
  content: string;
  primary_yn: "Y" | "N";
  view_count: number;
  use_yn: "Y" | "N";
  created_date: string; // 생성일 (ISO 8601)
  updated_date: string; // 수정일 (ISO 8601)
}

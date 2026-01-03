export interface IPush {
  id: number;
  use_yn: "Y" | "N";
  name: string;
  condition: string;
  landing_page: string;
  image_id: number;
  contents: string;
  created_date: string; // ISO date string
  updated_date: string; // ISO date string
}

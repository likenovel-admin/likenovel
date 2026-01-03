export interface IPopup {
  id: number;
  title: string;
  content: string;
  image_id: number;
  start_date: string; // ISO string, e.g. "1970-01-01T00:00:00"
  end_date: string;
  use_yn: "Y" | "N";
  url: string;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  image_path: string;
  image_filename: string;
}

export interface IBanner {
  id: number;
  position: string; // ex: "main"
  division: string; // ex: "top"
  title: string; // ex: "배너"
  show_start_date: string; // ISO datetime string
  show_end_date: string; // ISO datetime string
  show_order: number; // 노출 순서
  url: string; // 클릭 시 이동할 URL
  image_id: number; // 이미지 리소스 ID
  mobile_image_id: number; // 모바일 이미지 리소스 ID
  created_id: number; // 생성자 ID
  created_date: string; // 생성일 (ISO string)
  updated_id: number | null; // 수정자 ID (nullable)
  updated_date: string; // 수정일 (ISO string)
  image_path: string; // 이미지 URL
  file_name: string; // 파일명
  mobile_image_path: string; // 모바일 이미지 URL
  mobile_file_name: string; // 모바일 파일명
  show: "Y" | "N";
}

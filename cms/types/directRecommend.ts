export interface IDirectRecommend {
  id: number;
  name: string;
  order: number;
  product_ids: string;
  exposure_start_date: string;
  exposure_end_date: string;
  exposure_start_time_weekday: string;
  exposure_end_time_weekday: string;
  exposure_start_time_weekend: string;
  exposure_end_time_weekend: string;
  created_date: string;
  updated_date: string;
}

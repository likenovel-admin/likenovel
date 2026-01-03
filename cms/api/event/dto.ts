import { IEvent, IEventDetail } from "@/types/event";

export interface IGetEventsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IEvent[];
}

export interface IGetEventParams {
  type?: string;
  page?: number;
  count_per_page?: number;
}

export interface IAddEventRequest {
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  target_product_ids: number[];
  reward_type?: string;
  reward_amount: number;
  reward_max_people: number;
  show_yn_thumbnail_img: "Y" | "N";
  show_yn_detail_img: "Y" | "N";
  show_yn_product: "Y" | "N";
  show_yn_information: "Y" | "N";
  thumbnail_image_id?: number | null;
  detail_image_id?: number | null;
  account_name: string;
  product_ids: number[];
  information: string;
}

export interface IAddEventResponse {
  data: {
    message: string;
  };
}

export type IGetEventDetailResponse = IEventDetail;

export interface IUpdateAlgorithmSectionRequest {
  position?: string;
  feature: string;
}

export interface IUpdateAlgorithmSectionResponse {
  data: {
    message: string;
  };
}

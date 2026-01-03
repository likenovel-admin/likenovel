import { IPush } from "@/types/push";

export interface IGetPushResponse {
  results: IPush[];
}

export type IGetPushDetailResponse = IPush;

export interface IPushSendRequest {
  content: string;
  title: string;
  noti_type: string;
}

export interface IPushTemplateRequest {
  use_yn?: string;
  name?: string;
  condition?: string;
  landing_page?: string;
  image_id?: number;
  contents?: string;
}

export interface IPushResponse {
  data: {
    message: string;
  };
}

export interface IOnOffPushResponse {
  data: {
    message: string;
  };
}

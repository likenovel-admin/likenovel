import { IPopup } from "@/types/popup";

export type IGetPopupDetailResponse = IPopup;

export interface IPopupRequest {
  use_yn: string;
  url: string;
  image_id?: number;
}

export interface IEditPopupResponse {
  data: {
    message: string;
  };
}

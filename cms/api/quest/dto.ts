import { IQuest, IQuestDetail, Step } from "@/types/quest";

export interface IGetQuestResponse {
  data: IQuest[];
}

export type IGetQuestDetailResponse = IQuestDetail;

export interface IUpdateQuestRequest {
  use_yn?: "Y" | "N";
  name?: string;
  condition?: string;
  landing_page?: string;
  image_id?: number;
  contents?: string;
  renewal?: {
    MON: "Y" | "N";
    TUE: "Y" | "N";
    WED: "Y" | "N";
    THU: "Y" | "N";
    FRI: "Y" | "N";
    SAT: "Y" | "N";
    SUN: "Y" | "N";
  };
  step1?: Step;
  step2?: Step;
  step3?: Step;
}

export interface IUpdateQuestResponse {
  data: {
    message: string;
  };
}

export interface IOnOffQuestResponse {
  data: {
    message: string;
  };
}

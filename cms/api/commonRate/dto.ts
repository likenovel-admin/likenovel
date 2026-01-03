import { ICommonRate } from "@/types/commonRate";

export type IGetCommonRateResponse = ICommonRate;

export type ICommonRateRequest = ICommonRate;

export interface IEditCommonRateResponse {
  data: {
    message: string;
  };
}

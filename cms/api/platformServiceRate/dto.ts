import {
  IPlatformServiceRateConfig,
  IPlatformServiceRateGlobalRequest,
  IPlatformServiceRateProductRequest,
} from "@/types/platformServiceRate";

export type IGetPlatformServiceRateResponse = IPlatformServiceRateConfig;

export type IEditPlatformServiceRateGlobalRequest =
  IPlatformServiceRateGlobalRequest;

export type IEditPlatformServiceRateProductRequest =
  IPlatformServiceRateProductRequest;

export interface IEditPlatformServiceRateResponse {
  data: {
    message: string;
  };
}

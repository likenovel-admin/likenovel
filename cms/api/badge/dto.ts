import { IBadge } from "@/types/badge";

export interface IGetBadgeResponse {
  results: IBadge[];
}

export interface IUpdateBadgeRequest {
  promotion_conditions: number;
}

export interface IUpdateBadgeResponse {
  data: {
    message: string;
  };
}

"use client";
import {
  IGetDirectPromotionParams,
  IGetDirectPromotionResponse,
} from "@/api/directPromotion/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetDirectPromotions = (params: IGetDirectPromotionParams) => {
  return useQuery<IGetDirectPromotionResponse>({
    queryKey: ["GetDirectPromotion", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetDirectPromotionResponse>({
        url: "/v1/query/admins/direct-promotion",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

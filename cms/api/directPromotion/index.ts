"use client";
import {
  IGetDirectPromotionParams,
  IGetDirectPromotionResponse,
  IPostDirectPromotionGiftRequest,
  IPostDirectPromotionGiftResponse,
} from "@/api/directPromotion/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

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

export const usePostDirectPromotionGift = () => {
  return useMutation<
    IPostDirectPromotionGiftResponse,
    Error,
    IPostDirectPromotionGiftRequest
  >({
    mutationFn: async (body: IPostDirectPromotionGiftRequest) => {
      return await apiClient.request<IPostDirectPromotionGiftResponse>({
        url: "/v1/command/admins/direct-promotion/gift",
        method: "POST",
        body: body,
      });
    },
  });
};

"use client";

import {
  IAcceptAppliedPromotionResponse,
  IAppliedPromotionRequest,
  IAppliedPromotionResponse,
  IDenyAppliedPromotionResponse,
  IEndAppliedPromotionResponse,
  IGetAppliedPromotionParams,
  IGetAppliedPromotionResponse,
} from "@/api/appliedPromotion/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAppliedPromotions = (params: IGetAppliedPromotionParams) => {
  return useQuery<IGetAppliedPromotionResponse>({
    queryKey: ["GetAppliedPromotion", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetAppliedPromotionResponse>({
        url: "/v1/query/admins/applied-promotion",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useAddAppliedPromotion = () => {
  return useMutation<
    IAppliedPromotionResponse,
    Error,
    IAppliedPromotionRequest
  >({
    mutationFn: async (body: IAppliedPromotionRequest) => {
      return await apiClient.request<IAppliedPromotionResponse>({
        url: "/v1/command/admins/applied-promotion",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useAcceptAppliedPromotion = () => {
  return useMutation<
    IAcceptAppliedPromotionResponse,
    Error,
    {
      id: string;
      body: {
        end_date: string;
      };
    }
  >({
    mutationFn: async (data: { id: string; body: { end_date: string } }) => {
      return await apiClient.request<IAcceptAppliedPromotionResponse>({
        url: `/v1/command/admins/applied-promotion/${data.id}/accept`,
        method: "POST",
        body: data.body,
      });
    },
  });
};

export const useDenyAppliedPromotion = () => {
  return useMutation<IDenyAppliedPromotionResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDenyAppliedPromotionResponse>({
        url: `/v1/command/admins/applied-promotion/${id}/deny`,
        method: "POST",
      });
    },
  });
};

export const useEndAppliedPromotion = () => {
  return useMutation<IEndAppliedPromotionResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IEndAppliedPromotionResponse>({
        url: `/v1/command/admins/applied-promotion/${id}/end`,
        method: "POST",
      });
    },
  });
};

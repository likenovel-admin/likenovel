"use client";

import {
  IEditPlatformServiceRateGlobalRequest,
  IEditPlatformServiceRateProductRequest,
  IEditPlatformServiceRateResponse,
  IGetPlatformServiceRateResponse,
} from "@/api/platformServiceRate/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetPlatformServiceRateConfig = () => {
  return useQuery<IGetPlatformServiceRateResponse>({
    queryKey: ["GetPlatformServiceRateConfig"],
    queryFn: async () => {
      return await apiClient.request<IGetPlatformServiceRateResponse>({
        url: "/v1/query/admins/platform-service-rate",
        method: "GET",
      });
    },
  });
};

export const useEditPlatformServiceRateGlobal = () => {
  return useMutation<
    IEditPlatformServiceRateResponse,
    Error,
    IEditPlatformServiceRateGlobalRequest
  >({
    mutationFn: async (body: IEditPlatformServiceRateGlobalRequest) => {
      return await apiClient.request<IEditPlatformServiceRateResponse>({
        url: "/v1/command/admins/platform-service-rate/global",
        method: "POST",
        body,
      });
    },
  });
};

export const useEditPlatformServiceRateProduct = () => {
  return useMutation<
    IEditPlatformServiceRateResponse,
    Error,
    IEditPlatformServiceRateProductRequest
  >({
    mutationFn: async (body: IEditPlatformServiceRateProductRequest) => {
      return await apiClient.request<IEditPlatformServiceRateResponse>({
        url: "/v1/command/admins/platform-service-rate/product",
        method: "POST",
        body,
      });
    },
  });
};

export const useDeletePlatformServiceRateProduct = () => {
  return useMutation<IEditPlatformServiceRateResponse, Error, number>({
    mutationFn: async (productId: number) => {
      return await apiClient.request<IEditPlatformServiceRateResponse>({
        url: `/v1/command/admins/platform-service-rate/product/${productId}`,
        method: "DELETE",
      });
    },
  });
};

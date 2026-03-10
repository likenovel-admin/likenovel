"use client";

import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IAiOnboardingProductCommandResponse,
  IGetAiOnboardingProductResponse,
  IPutAiOnboardingProductsRequest,
} from "./dto";

export const useGetAiOnboardingProducts = () => {
  return useQuery<IGetAiOnboardingProductResponse>({
    queryKey: ["GetAiOnboardingProducts"],
    staleTime: 5000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await apiClient.request<IGetAiOnboardingProductResponse>({
        url: "/v1/query/admins/ai-onboarding-products",
        method: "GET",
      });
      return res;
    },
  });
};

export const usePutAiOnboardingProducts = () => {
  return useMutation<
    IAiOnboardingProductCommandResponse,
    Error,
    IPutAiOnboardingProductsRequest
  >({
    mutationFn: async (body) => {
      return await apiClient.request<IAiOnboardingProductCommandResponse>({
        url: "/v1/command/admins/ai-onboarding-products",
        method: "PUT",
        body,
      });
    },
  });
};

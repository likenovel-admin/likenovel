"use client";

import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IAdminDelegatedEpisodeApplyResponse,
  IAdminDelegatedEpisodeOperationRequest,
  IAdminDelegatedEpisodePreviewResponse,
  IAdminDelegatedEpisodeSummaryResponse,
} from "@/api/adminEpisodeManagement/dto";

export const useAdminDelegatedEpisodeSummary = (
  productId: number | null,
  enabled: boolean
) => {
  return useQuery<IAdminDelegatedEpisodeSummaryResponse>({
    queryKey: ["adminDelegatedEpisodeSummary", productId],
    enabled: enabled && productId != null,
    queryFn: async () => {
      return await apiClient.request<IAdminDelegatedEpisodeSummaryResponse>({
        url: `/v1/query/admins/products/${productId}/episodes/delegated/summary`,
        method: "GET",
      });
    },
  });
};

export const useAdminDelegatedEpisodePreview = () => {
  return useMutation<
    IAdminDelegatedEpisodePreviewResponse,
    Error,
    { productId: number; body: IAdminDelegatedEpisodeOperationRequest }
  >({
    mutationFn: async ({ productId, body }) => {
      return await apiClient.request<IAdminDelegatedEpisodePreviewResponse>({
        url: `/v1/command/admins/products/${productId}/episodes/delegated/preview`,
        method: "POST",
        body,
      });
    },
  });
};

export const useAdminDelegatedEpisodeApply = () => {
  return useMutation<
    IAdminDelegatedEpisodeApplyResponse,
    Error,
    { productId: number; body: IAdminDelegatedEpisodeOperationRequest }
  >({
    mutationFn: async ({ productId, body }) => {
      return await apiClient.request<IAdminDelegatedEpisodeApplyResponse>({
        url: `/v1/command/admins/products/${productId}/episodes/delegated/apply`,
        method: "POST",
        body,
      });
    },
  });
};

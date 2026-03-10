"use client";

import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IAiProductMetadataCommandResponse,
  IGetAiProductMetadataDetailResponse,
  IGetAiProductMetadataParams,
  IGetAiProductMetadataResponse,
  IPutAiProductMetadataExcludeRequest,
  IPutAiProductMetadataRequest,
} from "./dto";

export const useGetAiProductMetadataList = (
  params: IGetAiProductMetadataParams
) => {
  return useQuery<IGetAiProductMetadataResponse>({
    queryKey: ["GetAiProductMetadataList", JSON.stringify(params)],
    queryFn: async () => {
      const res = await apiClient.request<IGetAiProductMetadataResponse>({
        url: "/v1/query/admins/ai-product-metadata",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetAiProductMetadataDetail = (
  productId: number | null,
  enabled: boolean
) => {
  return useQuery<IGetAiProductMetadataDetailResponse>({
    queryKey: ["GetAiProductMetadataDetail", productId],
    queryFn: async () => {
      const res = await apiClient.request<IGetAiProductMetadataDetailResponse>({
        url: `/v1/query/admins/ai-product-metadata/${productId}`,
        method: "GET",
      });
      return res;
    },
    enabled: enabled && !!productId,
  });
};

export const usePutAiProductMetadata = () => {
  return useMutation<
    IAiProductMetadataCommandResponse,
    Error,
    { product_id: number; body: IPutAiProductMetadataRequest }
  >({
    mutationFn: async ({ product_id, body }) => {
      return await apiClient.request<IAiProductMetadataCommandResponse>({
        url: `/v1/command/admins/ai-product-metadata/${product_id}`,
        method: "PUT",
        body,
      });
    },
  });
};

export const usePostAiProductMetadataReanalyze = () => {
  return useMutation<
    IAiProductMetadataCommandResponse,
    Error,
    { product_id: number }
  >({
    mutationFn: async ({ product_id }) => {
      return await apiClient.request<IAiProductMetadataCommandResponse>({
        url: `/v1/command/admins/ai-product-metadata/${product_id}/reanalyze`,
        method: "POST",
      });
    },
  });
};

export const usePutAiProductMetadataExclude = () => {
  return useMutation<
    IAiProductMetadataCommandResponse,
    Error,
    IPutAiProductMetadataExcludeRequest
  >({
    mutationFn: async ({ product_id, exclude_from_recommend_yn }) => {
      return await apiClient.request<IAiProductMetadataCommandResponse>({
        url: `/v1/command/admins/ai-product-metadata/${product_id}/exclude`,
        method: "PUT",
        body: { exclude_from_recommend_yn },
      });
    },
  });
};

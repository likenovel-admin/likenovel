"use client";

import {
  IGetBlindListParams,
  IGetBlindListResponse,
  IPostBatchBlindRequest,
  IPostBatchMonopolyRequest,
  IPostBatchOpenRequest,
  IBlindDownloadResponse,
} from "@/api/blind/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BLIND_LIST_KEY = "blindList";

export const useGetBlindList = (params: IGetBlindListParams) => {
  return useQuery<IGetBlindListResponse>({
    queryKey: [BLIND_LIST_KEY, JSON.stringify(params)],
    queryFn: async () => {
      return await apiClient.request<IGetBlindListResponse>({
        url: "/v1/query/admins/products/blind-list",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useBatchBlind = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: IPostBatchBlindRequest) => {
      return await apiClient.request({
        url: "/v1/command/admins/products/batch-blind",
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BLIND_LIST_KEY] });
    },
  });
};

export const useBatchOpen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: IPostBatchOpenRequest) => {
      return await apiClient.request({
        url: "/v1/command/admins/products/batch-open",
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BLIND_LIST_KEY] });
    },
  });
};

export const useBatchMonopoly = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: IPostBatchMonopolyRequest) => {
      return await apiClient.request({
        url: "/v1/command/admins/products/batch-monopoly",
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BLIND_LIST_KEY] });
    },
  });
};

export const downloadBlindProductTxt = async (productId: number) => {
  return await apiClient.request<IBlindDownloadResponse>({
    url: `/v1/query/admins/products/${productId}/episodes-txt`,
    method: "GET",
    responseType: "blob",
  });
};

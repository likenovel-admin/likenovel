"use client";

import {
  IGetMainSingleSlotParams,
  IGetMainSingleSlotResponse,
  IMainSingleSlotCommandResponse,
  IMainSingleSlotRequest,
  ISearchMainSingleSlotProductParams,
  ISearchMainSingleSlotProductResponse,
} from "@/api/mainSingleSlot/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetMainSingleSlots = (params: IGetMainSingleSlotParams) => {
  return useQuery<IGetMainSingleSlotResponse>({
    queryKey: ["GetMainSingleSlots", JSON.stringify(params)],
    queryFn: async () => {
      return await apiClient.request<IGetMainSingleSlotResponse>({
        url: "/v1/query/admins/main-single-slots",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useSearchMainSingleSlotProducts = (
  params: ISearchMainSingleSlotProductParams,
  enabled: boolean
) => {
  return useQuery<ISearchMainSingleSlotProductResponse>({
    queryKey: ["SearchMainSingleSlotProducts", JSON.stringify(params)],
    enabled,
    queryFn: async () => {
      return await apiClient.request<ISearchMainSingleSlotProductResponse>({
        url: "/v1/query/admins/main-single-slots/products/search",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useCreateMainSingleSlot = () => {
  return useMutation<
    IMainSingleSlotCommandResponse,
    Error,
    IMainSingleSlotRequest
  >({
    mutationFn: async (body: IMainSingleSlotRequest) => {
      return await apiClient.request<IMainSingleSlotCommandResponse>({
        url: "/v1/command/admins/main-single-slots",
        method: "POST",
        body,
      });
    },
  });
};

export const usePublishMainSingleSlotNow = () => {
  return useMutation<
    IMainSingleSlotCommandResponse,
    Error,
    IMainSingleSlotRequest
  >({
    mutationFn: async (body: IMainSingleSlotRequest) => {
      return await apiClient.request<IMainSingleSlotCommandResponse>({
        url: "/v1/command/admins/main-single-slots/publish-now",
        method: "POST",
        body,
      });
    },
  });
};

export const useUpdateMainSingleSlot = () => {
  return useMutation<
    IMainSingleSlotCommandResponse,
    Error,
    { singleSlotId: number; body: IMainSingleSlotRequest }
  >({
    mutationFn: async ({ singleSlotId, body }) => {
      return await apiClient.request<IMainSingleSlotCommandResponse>({
        url: `/v1/command/admins/main-single-slots/${singleSlotId}`,
        method: "PUT",
        body,
      });
    },
  });
};

export const useCancelMainSingleSlot = () => {
  return useMutation<IMainSingleSlotCommandResponse, Error, number>({
    mutationFn: async (singleSlotId: number) => {
      return await apiClient.request<IMainSingleSlotCommandResponse>({
        url: `/v1/command/admins/main-single-slots/${singleSlotId}`,
        method: "DELETE",
      });
    },
  });
};

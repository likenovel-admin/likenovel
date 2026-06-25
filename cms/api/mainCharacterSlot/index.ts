"use client";

import {
  IGetCharacterRosterResponse,
  IGetMainCharacterSlotParams,
  IGetMainCharacterSlotResponse,
  IMainCharacterSlotCommandResponse,
  IMainCharacterSlotRequest,
  ISearchMainCharacterSlotProductParams,
  ISearchMainCharacterSlotProductResponse,
} from "@/api/mainCharacterSlot/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetMainCharacterSlots = (params: IGetMainCharacterSlotParams) => {
  return useQuery<IGetMainCharacterSlotResponse>({
    queryKey: ["GetMainCharacterSlots", JSON.stringify(params)],
    queryFn: async () => {
      return await apiClient.request<IGetMainCharacterSlotResponse>({
        url: "/v1/query/admins/main-character-slots",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useSearchMainCharacterSlotProducts = (
  params: ISearchMainCharacterSlotProductParams,
  enabled: boolean
) => {
  return useQuery<ISearchMainCharacterSlotProductResponse>({
    queryKey: ["SearchMainCharacterSlotProducts", JSON.stringify(params)],
    enabled,
    queryFn: async () => {
      return await apiClient.request<ISearchMainCharacterSlotProductResponse>({
        url: "/v1/query/admins/main-character-slots/products/search",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useGetCharacterRoster = (productId: number | null, enabled: boolean) => {
  return useQuery<IGetCharacterRosterResponse>({
    queryKey: ["GetCharacterRoster", productId],
    enabled: enabled && Boolean(productId),
    queryFn: async () => {
      return await apiClient.request<IGetCharacterRosterResponse>({
        url: "/v1/query/admins/main-character-slots/characters",
        method: "GET",
        queryParams: { product_id: productId },
      });
    },
  });
};

export const useCreateMainCharacterSlot = () => {
  return useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    IMainCharacterSlotRequest
  >({
    mutationFn: async (body: IMainCharacterSlotRequest) => {
      return await apiClient.request<IMainCharacterSlotCommandResponse>({
        url: "/v1/command/admins/main-character-slots",
        method: "POST",
        body,
      });
    },
  });
};

export const usePublishMainCharacterSlotNow = () => {
  return useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    IMainCharacterSlotRequest
  >({
    mutationFn: async (body: IMainCharacterSlotRequest) => {
      return await apiClient.request<IMainCharacterSlotCommandResponse>({
        url: "/v1/command/admins/main-character-slots/publish-now",
        method: "POST",
        body,
      });
    },
  });
};

export const useUpdateMainCharacterSlot = () => {
  return useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    { characterSlotId: number; body: IMainCharacterSlotRequest }
  >({
    mutationFn: async ({ characterSlotId, body }) => {
      return await apiClient.request<IMainCharacterSlotCommandResponse>({
        url: `/v1/command/admins/main-character-slots/${characterSlotId}`,
        method: "PUT",
        body,
      });
    },
  });
};

export const useCancelMainCharacterSlot = () => {
  return useMutation<IMainCharacterSlotCommandResponse, Error, number>({
    mutationFn: async (characterSlotId: number) => {
      return await apiClient.request<IMainCharacterSlotCommandResponse>({
        url: `/v1/command/admins/main-character-slots/${characterSlotId}`,
        method: "DELETE",
      });
    },
  });
};

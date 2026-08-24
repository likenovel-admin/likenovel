"use client";

import {
  IGetMainCharacterSlotParams,
  IGetMainCharacterSlotConfigResponse,
  IGetMainCharacterSlotProductParams,
  IGetMainCharacterSlotProductResponse,
  IGetMainCharacterSlotResponse,
  IGetMainCharacterSlotRosterResponse,
  IMainCharacterSlotCommandResponse,
  IMainCharacterSlotRequest,
  IUpdateMainCharacterSlotConfigRequest,
} from "@/api/mainCharacterSlot/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetMainCharacterSlotConfig = () =>
  useQuery<IGetMainCharacterSlotConfigResponse>({
    queryKey: ["GetMainCharacterSlotConfig"],
    queryFn: () =>
      apiClient.request<IGetMainCharacterSlotConfigResponse>({
        url: "/v1/query/admins/main-character-slots/config",
        method: "GET",
      }),
  });

export const useUpdateMainCharacterSlotConfig = () =>
  useMutation<
    IGetMainCharacterSlotConfigResponse,
    Error,
    IUpdateMainCharacterSlotConfigRequest
  >({
    mutationFn: (body) =>
      apiClient.request<IGetMainCharacterSlotConfigResponse>({
        url: "/v1/command/admins/main-character-slots/config",
        method: "PUT",
        body,
      }),
  });

export const useGetMainCharacterSlots = (
  params: IGetMainCharacterSlotParams
) =>
  useQuery<IGetMainCharacterSlotResponse>({
    queryKey: ["GetMainCharacterSlots", JSON.stringify(params)],
    queryFn: () =>
      apiClient.request<IGetMainCharacterSlotResponse>({
        url: "/v1/query/admins/main-character-slots",
        method: "GET",
        queryParams: params,
      }),
  });

export const useGetMainCharacterSlotProducts = (
  params: IGetMainCharacterSlotProductParams
) =>
  useQuery<IGetMainCharacterSlotProductResponse>({
    queryKey: ["GetMainCharacterSlotProducts", JSON.stringify(params)],
    queryFn: () =>
      apiClient.request<IGetMainCharacterSlotProductResponse>({
        url: "/v1/query/admins/main-character-slots/products",
        method: "GET",
        queryParams: params,
      }),
  });

export const useGetMainCharacterSlotRoster = (
  productId: number | null
) =>
  useQuery<IGetMainCharacterSlotRosterResponse>({
    queryKey: ["GetMainCharacterSlotRoster", productId],
    enabled: !!productId,
    queryFn: () =>
      apiClient.request<IGetMainCharacterSlotRosterResponse>({
        url: `/v1/query/admins/main-character-slots/products/${productId}/characters`,
        method: "GET",
      }),
  });

export const useCreateMainCharacterSlot = () =>
  useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    IMainCharacterSlotRequest
  >({
    mutationFn: (body) =>
      apiClient.request<IMainCharacterSlotCommandResponse>({
        url: "/v1/command/admins/main-character-slots",
        method: "POST",
        body,
      }),
  });

export const usePublishMainCharacterSlotNow = () =>
  useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    IMainCharacterSlotRequest
  >({
    mutationFn: (body) =>
      apiClient.request<IMainCharacterSlotCommandResponse>({
        url: "/v1/command/admins/main-character-slots/publish-now",
        method: "POST",
        body,
      }),
  });

export const useUpdateMainCharacterSlot = () =>
  useMutation<
    IMainCharacterSlotCommandResponse,
    Error,
    { characterSlotId: number; body: IMainCharacterSlotRequest }
  >({
    mutationFn: ({ characterSlotId, body }) =>
      apiClient.request<IMainCharacterSlotCommandResponse>({
        url: `/v1/command/admins/main-character-slots/${characterSlotId}`,
        method: "PUT",
        body,
      }),
  });

export const useDeleteMainCharacterSlot = () =>
  useMutation<IMainCharacterSlotCommandResponse, Error, number>({
    mutationFn: (characterSlotId) =>
      apiClient.request<IMainCharacterSlotCommandResponse>({
        url: `/v1/command/admins/main-character-slots/${characterSlotId}`,
        method: "DELETE",
      }),
  });

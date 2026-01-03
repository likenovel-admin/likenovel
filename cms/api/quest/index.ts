"use client";

import {
  IGetQuestDetailResponse,
  IGetQuestResponse,
  IOnOffQuestResponse,
  IUpdateQuestRequest,
  IUpdateQuestResponse,
} from "@/api/quest/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetQuests = () => {
  return useQuery<IGetQuestResponse>({
    queryKey: ["GetQuest"],

    queryFn: async () => {
      const res = await apiClient.request<IGetQuestResponse>({
        url: "/v1/query/admins/quests",
        method: "GET",
      });
      return res;
    },
  });
};

export const useGetQuestDetail = (id: string) => {
  return useQuery<IGetQuestDetailResponse>({
    queryKey: ["GetQuestDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetQuestDetailResponse>({
        url: "/v1/query/admins/quests/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useOnQuest = () => {
  return useMutation<IOnOffQuestResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IOnOffQuestResponse>({
        url: `/v1/command/admins/quests/${id}/on`,
        method: "POST",
      });
    },
  });
};

export const useOffQuest = () => {
  return useMutation<IOnOffQuestResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IOnOffQuestResponse>({
        url: `/v1/command/admins/quests/${id}/off`,
        method: "POST",
      });
    },
  });
};

export const useUpdateQuest = () => {
  return useMutation<
    IUpdateQuestResponse,
    Error,
    {
      id: string;
      body: IUpdateQuestRequest;
    }
  >({
    mutationFn: async (data: { id: string; body: IUpdateQuestRequest }) => {
      return await apiClient.request<IUpdateQuestResponse>({
        url: `/v1/command/admins/quests/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

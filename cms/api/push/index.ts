"use client";

import {
  IGetPushDetailResponse,
  IGetPushResponse,
  IOnOffPushResponse,
  IPushResponse,
  IPushSendRequest,
  IPushTemplateRequest,
} from "@/api/push/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetPushTemplate = () => {
  return useQuery<IGetPushResponse>({
    queryKey: ["GetPush"],

    queryFn: async () => {
      const res = await apiClient.request<IGetPushResponse>({
        url: "/v1/query/admins/push/templates",
        method: "GET",
      });
      return res;
    },
  });
};

export const useGetPushTemplateDetail = (id: string) => {
  return useQuery<IGetPushDetailResponse>({
    queryKey: ["GetPushDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetPushDetailResponse>({
        url: "/v1/query/admins/push/templates/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useSendPush = () => {
  return useMutation<IPushResponse, Error, IPushSendRequest>({
    mutationFn: async (body: IPushSendRequest) => {
      return await apiClient.request<IPushResponse>({
        url: "/v1/command/admins/push/send",
        method: "PUT",
        body: body,
      });
    },
  });
};

export const useOnPush = () => {
  return useMutation<IOnOffPushResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IOnOffPushResponse>({
        url: `/v1/command/admins/push/templates/${id}/on`,
        method: "POST",
      });
    },
  });
};

export const useOffPush = () => {
  return useMutation<IOnOffPushResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IOnOffPushResponse>({
        url: `/v1/command/admins/push/templates/${id}/off`,
        method: "POST",
      });
    },
  });
};

export const useUpdateTemplatePush = () => {
  return useMutation<
    IPushResponse,
    Error,
    {
      id: string;
      body: IPushTemplateRequest;
    }
  >({
    mutationFn: async (data: { id: string; body: IPushTemplateRequest }) => {
      return await apiClient.request<IPushResponse>({
        url: `/v1/command/admins/push/templates/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

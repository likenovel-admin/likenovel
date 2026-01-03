"use client";

import {
  IGetBadgeResponse,
  IUpdateBadgeRequest,
  IUpdateBadgeResponse,
} from "@/api/badge/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetBadge = () => {
  return useQuery<IGetBadgeResponse>({
    queryKey: ["GetBadge"],

    queryFn: async () => {
      const res = await apiClient.request<IGetBadgeResponse>({
        url: "/v1/query/admins/badge",
        method: "GET",
      });
      return res;
    },
  });
};

export const useUpdateBadge = () => {
  return useMutation<
    IUpdateBadgeResponse,
    Error,
    { id: string; body: IUpdateBadgeRequest }
  >({
    mutationFn: async (data: { id: string; body: IUpdateBadgeRequest }) => {
      return await apiClient.request<IUpdateBadgeResponse>({
        url: `/v1/command/admins/badge/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

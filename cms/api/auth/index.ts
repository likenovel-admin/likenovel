"use client";

import {
  IAdminDetailResponse,
  ILoginInRequest,
  ILoginInResponse,
} from "@/api/auth/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLoginIn = () => {
  return useMutation<ILoginInResponse, Error, ILoginInRequest>({
    mutationFn: async (data: ILoginInRequest) => {
      return await apiClient.request<ILoginInResponse>({
        url: "/v1/command/admins/login",
        method: "POST",
        body: data,
      });
    },
  });
};

export const useGetAdminDetail = (id: number) => {
  return useQuery<IAdminDetailResponse>({
    queryKey: ["GetAdmin", id],

    queryFn: async () => {
      const res = await apiClient.request<IAdminDetailResponse>({
        url: "/v1/query/admins/detail/" + id + "/profiles",
        method: "GET",
      });
      return res;
    },
    enabled: !!id,
  });
};

"use client";

import {
  IGetUserGiftBookDownloadResponse,
  IGetUserGiftBookParams,
  IGetUserGiftBookResponse,
  IPostAdminDirectGiftRequest,
  IPostAdminDirectGiftResponse,
} from "@/api/userGiftBook/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetUserGiftBooks = (params: IGetUserGiftBookParams) => {
  return useQuery<IGetUserGiftBookResponse>({
    queryKey: ["GetUserGiftBook", JSON.stringify(params)],
    queryFn: async () => {
      const res = await apiClient.request<IGetUserGiftBookResponse>({
        url: "/v1/query/admins/user-giftbook",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const downloadUserGiftBook = async (id: string) => {
  return await apiClient.request<IGetUserGiftBookDownloadResponse>({
    url: "/v1/query/admins/user-giftbook/" + id,
    method: "GET",
  });
};

export const usePostAdminDirectGift = () => {
  return useMutation<
    IPostAdminDirectGiftResponse,
    Error,
    IPostAdminDirectGiftRequest
  >({
    mutationFn: async (body: IPostAdminDirectGiftRequest) => {
      return await apiClient.request<IPostAdminDirectGiftResponse>({
        url: "/v1/command/admins/user-giftbook/admin-direct",
        method: "POST",
        body: body,
      });
    },
  });
};

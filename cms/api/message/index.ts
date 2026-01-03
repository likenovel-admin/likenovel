"use client";
import {
  IGetMessageDownloadResponse,
  IGetMessageParams,
  IGetMessageResponse,
} from "@/api/message/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetMessages = (params: IGetMessageParams) => {
  return useQuery<IGetMessageResponse>({
    queryKey: ["GetMessage", JSON.stringify(params)],
    queryFn: async () => {
      const res = await apiClient.request<IGetMessageResponse>({
        url: "/v1/query/admins/messages",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getMessageDownload = async (params: IGetMessageResponse) => {
  return await apiClient.request<IGetMessageDownloadResponse>({
    url: "/v1/query/admins/messages/all",
    method: "GET",
    queryParams: params,
  });
};

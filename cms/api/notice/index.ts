"use client";

import {
  IAddEditNoticeResponse,
  IGetLiveNoticeTopBarResponse,
  IGetNoticeDetailResponse,
  IGetNoticeParams,
  IGetNoticeResponse,
  INoticeRequest,
} from "@/api/notice/dto";
import { IDeleteNoticeResponse } from "@/api/reviewCommentNotice/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetNotices = (params: IGetNoticeParams) => {
  return useQuery<IGetNoticeResponse>({
    queryKey: ["GetNotice", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetNoticeResponse>({
        url: "/v1/query/admins/general-notices",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetNoticeDetail = (id: string) => {
  return useQuery<IGetNoticeDetailResponse>({
    queryKey: ["GetNoticeDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetNoticeDetailResponse>({
        url: "/v1/query/admins/general-notices/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

// 목록에서 어떤 띠가 실제로 떠 있는지 보여주려고 공개 API를 그대로 읽는다.
export const useGetLiveNoticeTopBar = () => {
  return useQuery<IGetLiveNoticeTopBarResponse>({
    queryKey: ["GetLiveNoticeTopBar"],
    refetchOnMount: "always",
    queryFn: async () => {
      return await apiClient.request<IGetLiveNoticeTopBarResponse>({
        url: "/v1/query/notices/top-bar",
        method: "GET",
        notAuth: true,
      });
    },
  });
};

export const useEditNotice = () => {
  return useMutation<
    IAddEditNoticeResponse,
    Error,
    { id: string; body: INoticeRequest }
  >({
    mutationFn: async (data: { id: string; body: INoticeRequest }) => {
      return await apiClient.request<IAddEditNoticeResponse>({
        url: "/v1/command/admins/general-notices/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddNotice = () => {
  return useMutation<IAddEditNoticeResponse, Error, INoticeRequest>({
    mutationFn: async (body: INoticeRequest) => {
      return await apiClient.request<IAddEditNoticeResponse>({
        url: "/v1/command/admins/general-notices",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeleteNotice = () => {
  return useMutation<IDeleteNoticeResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteNoticeResponse>({
        url: "/v1/command/admins/general-notices/" + id,
        method: "DELETE",
      });
    },
  });
};

"use client";

import {
  IAddEditDirectRecommendResponse,
  IDeleteDirectRecommendResponse,
  IDirectRecommendRequest,
  IGetDirectRecommendDetailResponse,
  IGetDirectRecommendParams,
  IGetDirectRecommendResponse,
} from "@/api/directRecommend/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetDirectRecommends = (params: IGetDirectRecommendParams) => {
  return useQuery<IGetDirectRecommendResponse>({
    queryKey: ["GetDirectRecommend", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetDirectRecommendResponse>({
        url: "/v1/query/admins/direct-recommend",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetDirectRecommendDetail = (id: string) => {
  return useQuery<IGetDirectRecommendDetailResponse>({
    queryKey: ["GetDirectRecommendDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetDirectRecommendDetailResponse>({
        url: "/v1/query/admins/direct-recommend/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditDirectRecommend = () => {
  return useMutation<
    IAddEditDirectRecommendResponse,
    Error,
    { id: string; body: IDirectRecommendRequest }
  >({
    mutationFn: async (data: { id: string; body: IDirectRecommendRequest }) => {
      return await apiClient.request<IAddEditDirectRecommendResponse>({
        url: "/v1/command/admins/direct-recommend/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddDirectRecommend = () => {
  return useMutation<
    IAddEditDirectRecommendResponse,
    Error,
    IDirectRecommendRequest
  >({
    mutationFn: async (body: IDirectRecommendRequest) => {
      return await apiClient.request<IAddEditDirectRecommendResponse>({
        url: "/v1/command/admins/direct-recommend",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeleteDirectRecommend = () => {
  return useMutation<IDeleteDirectRecommendResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteDirectRecommendResponse>({
        url: "/v1/command/admins/direct-recommend/" + id,
        method: "DELETE",
      });
    },
  });
};

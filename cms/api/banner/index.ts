"use client";

import {
  IAddEditBannerResponse,
  IBannerRequest,
  IDeleteBannerResponse,
  IGetBannerDetailResponse,
  IGetBannerParams,
  IGetBannerResponse,
  IReorderBannersRequest,
  IReorderBannersResponse,
} from "@/api/banner/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetBanners = (params: IGetBannerParams) => {
  return useQuery<IGetBannerResponse>({
    queryKey: ["GetBanner", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetBannerResponse>({
        url: "/v1/query/admins/banners",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetBannerDetail = (id: string) => {
  return useQuery<IGetBannerDetailResponse>({
    queryKey: ["GetBannerDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetBannerDetailResponse>({
        url: "/v1/query/admins/banners/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditBanner = () => {
  return useMutation<
    IAddEditBannerResponse,
    Error,
    { id: string; body: IBannerRequest }
  >({
    mutationFn: async (data: { id: string; body: IBannerRequest }) => {
      return await apiClient.request<IAddEditBannerResponse>({
        url: "/v1/command/admins/banners/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddBanner = () => {
  return useMutation<IAddEditBannerResponse, Error, IBannerRequest>({
    mutationFn: async (body: IBannerRequest) => {
      return await apiClient.request<IAddEditBannerResponse>({
        url: "/v1/command/admins/banners",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeleteBanner = () => {
  return useMutation<IDeleteBannerResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteBannerResponse>({
        url: "/v1/command/admins/banners/" + id,
        method: "DELETE",
      });
    },
  });
};

export const useReorderBanners = () => {
  return useMutation<IReorderBannersResponse, Error, IReorderBannersRequest>({
    mutationFn: async (body: IReorderBannersRequest) => {
      return await apiClient.request<IReorderBannersResponse>({
        url: "/v1/command/admins/banners/reorder",
        method: "POST",
        body,
      });
    },
  });
};

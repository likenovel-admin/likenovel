"use client";

import {
  IAddEditKeywordResponse,
  IDeleteKeywordResponse,
  IGetKeywordCategoriesResponse,
  IGetKeywordParams,
  IGetKeywordResponse,
  IKeywordRequest,
} from "@/api/keyword/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetKeywords = (params: IGetKeywordParams) => {
  return useQuery<IGetKeywordResponse>({
    queryKey: ["GetKeyword", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetKeywordResponse>({
        url: "/v1/query/admins/keywords",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetKeywordCategories = () => {
  return useQuery<IGetKeywordCategoriesResponse>({
    queryKey: ["GetKeywordCategories"],

    queryFn: async () => {
      const res = await apiClient.request<IGetKeywordCategoriesResponse>({
        url: "/v1/query/admins/keywords/categories",
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditKeyword = () => {
  return useMutation<
    IAddEditKeywordResponse,
    Error,
    { id: string; body: IKeywordRequest }
  >({
    mutationFn: async (data: { id: string; body: IKeywordRequest }) => {
      return await apiClient.request<IAddEditKeywordResponse>({
        url: "/v1/command/admins/keywords/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddKeyword = () => {
  return useMutation<IAddEditKeywordResponse, Error, IKeywordRequest>({
    mutationFn: async (body: IKeywordRequest) => {
      return await apiClient.request<IAddEditKeywordResponse>({
        url: "/v1/command/admins/keywords",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeleteKeyword = () => {
  return useMutation<IDeleteKeywordResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteKeywordResponse>({
        url: "/v1/command/admins/keywords/" + id,
        method: "DELETE",
      });
    },
  });
};

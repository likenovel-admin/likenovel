"use client";

import {
  IAddEditFaqResponse,
  IDeleteFaqResponse,
  IFaqCategory,
  IFaqCategoryRequest,
  IFaqRequest,
  IGetFaqDetailResponse,
  IGetFaqParams,
  IGetFaqResponse,
} from "@/api/faq/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetFaqs = (params: IGetFaqParams) => {
  return useQuery<IGetFaqResponse>({
    queryKey: ["GetFaq", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetFaqResponse>({
        url: "/v1/query/admins/faq",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetFaqDetail = (id: string) => {
  return useQuery<IGetFaqDetailResponse>({
    queryKey: ["GetFaqDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetFaqDetailResponse>({
        url: "/v1/query/admins/faq/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditFaq = () => {
  return useMutation<
    IAddEditFaqResponse,
    Error,
    { id: string; body: IFaqRequest }
  >({
    mutationFn: async (data: { id: string; body: IFaqRequest }) => {
      return await apiClient.request<IAddEditFaqResponse>({
        url: "/v1/command/admins/faq/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddFaq = () => {
  return useMutation<IAddEditFaqResponse, Error, IFaqRequest>({
    mutationFn: async (body: IFaqRequest) => {
      return await apiClient.request<IAddEditFaqResponse>({
        url: "/v1/command/admins/faq",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeleteFaq = () => {
  return useMutation<IDeleteFaqResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteFaqResponse>({
        url: "/v1/command/admins/faq/" + id,
        method: "DELETE",
      });
    },
  });
};

// ── FAQ 카테고리 ──

export const useGetFaqCategories = () => {
  return useQuery<IFaqCategory[]>({
    queryKey: ["GetFaqCategories"],
    queryFn: async () => {
      const res = await apiClient.request<IFaqCategory[]>({
        url: "/v1/query/admins/faq-categories",
        method: "GET",
      });
      return res;
    },
  });
};

export const useAddFaqCategory = () => {
  return useMutation<IAddEditFaqResponse, Error, IFaqCategoryRequest>({
    mutationFn: async (body: IFaqCategoryRequest) => {
      return await apiClient.request<IAddEditFaqResponse>({
        url: "/v1/command/admins/faq-categories",
        method: "POST",
        body,
      });
    },
  });
};

export const useEditFaqCategory = () => {
  return useMutation<
    IAddEditFaqResponse,
    Error,
    { code: string; body: IFaqCategoryRequest }
  >({
    mutationFn: async ({ code, body }) => {
      return await apiClient.request<IAddEditFaqResponse>({
        url: "/v1/command/admins/faq-categories/" + code,
        method: "PUT",
        body,
      });
    },
  });
};

export const useDeleteFaqCategory = () => {
  return useMutation<IDeleteFaqResponse, Error, string>({
    mutationFn: async (code: string) => {
      return await apiClient.request<IDeleteFaqResponse>({
        url: "/v1/command/admins/faq-categories/" + code,
        method: "DELETE",
      });
    },
  });
};

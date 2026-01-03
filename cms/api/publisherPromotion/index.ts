"use client";

import {
  IAddEditPublisherPromotionResponse,
  IDeletePublisherPromotionResponse,
  IGetPublisherPromotionCategoriesResponse,
  IGetPublisherPromotionParams,
  IGetPublisherPromotionResponse,
  IPublisherPromotionRequest,
} from "@/api/publisherPromotion/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetPublisherPromotions = (
  params: IGetPublisherPromotionParams
) => {
  return useQuery<IGetPublisherPromotionResponse>({
    queryKey: ["GetPublisherPromotion", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetPublisherPromotionResponse>({
        url: "/v1/query/admins/publisher-promotion",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetPublisherPromotionDetail = (id: string) => {
  return useQuery<IGetPublisherPromotionCategoriesResponse>({
    queryKey: ["GetPublisherPromotionDetail"],

    queryFn: async () => {
      const res =
        await apiClient.request<IGetPublisherPromotionCategoriesResponse>({
          url: "/v1/query/admins/publisher-promotion/" + id,
          method: "GET",
        });
      return res;
    },
  });
};

export const useEditPublisherPromotion = () => {
  return useMutation<
    IAddEditPublisherPromotionResponse,
    Error,
    { id: string; body: IPublisherPromotionRequest }
  >({
    mutationFn: async (data: {
      id: string;
      body: IPublisherPromotionRequest;
    }) => {
      return await apiClient.request<IAddEditPublisherPromotionResponse>({
        url: "/v1/command/admins/publisher-promotion/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useAddPublisherPromotion = () => {
  return useMutation<
    IAddEditPublisherPromotionResponse,
    Error,
    IPublisherPromotionRequest
  >({
    mutationFn: async (body: IPublisherPromotionRequest) => {
      return await apiClient.request<IAddEditPublisherPromotionResponse>({
        url: "/v1/command/admins/publisher-promotion",
        method: "POST",
        body: body,
      });
    },
  });
};

export const useDeletePublisherPromotion = () => {
  return useMutation<IDeletePublisherPromotionResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeletePublisherPromotionResponse>({
        url: "/v1/command/admins/publisher-promotion/" + id,
        method: "DELETE",
      });
    },
  });
};

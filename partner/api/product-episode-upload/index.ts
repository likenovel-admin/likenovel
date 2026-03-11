"use client";

import {
  IEpisodeDeleteRequest,
  IEpisodeDeleteResponse,
  IEpubEpisodeBatchUploadRequest,
  IEpubEpisodeBatchUploadResponse,
  IEpubEpisodeUploadRequest,
  IEpubEpisodeUploadResponse,
  IEpisodeReviewCancelRequest,
  IEpisodeReviewCancelResponse,
  IEpisodeReviewRequest,
  IEpisodeReviewResponse,
  IEpisodeSaleReserveCancelRequest,
  IEpisodeSaleReserveRequest,
  IEpisodeSaleResponse,
  IEpisodeSaleStartRequest,
} from "@/api/product-episode-upload/dto";
import apiClient from "@/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

interface IUploadEpisodeParam<TBody> {
  productId: string;
  body: TBody;
  save?: "Y" | "N";
}

export const useUploadSingleEpisodeEpub = () => {
  return useMutation<
    IEpubEpisodeUploadResponse,
    Error,
    IUploadEpisodeParam<IEpubEpisodeUploadRequest>
  >({
    mutationFn: async ({ productId, body, save }: IUploadEpisodeParam<IEpubEpisodeUploadRequest>) =>
      apiClient.request<IEpubEpisodeUploadResponse>({
        url: `/v1/command/episodes/products/${productId}/epub`,
        method: "POST",
        queryParams: save ? { save } : undefined,
        body,
      }),
  });
};

export const useUploadBatchEpisodeEpub = () => {
  return useMutation<
    IEpubEpisodeBatchUploadResponse,
    Error,
    IUploadEpisodeParam<IEpubEpisodeBatchUploadRequest>
  >({
    mutationFn: async ({ productId, body, save }: IUploadEpisodeParam<IEpubEpisodeBatchUploadRequest>) =>
      apiClient.request<IEpubEpisodeBatchUploadResponse>({
        url: `/v1/command/episodes/products/${productId}/epub/batch`,
        method: "POST",
        queryParams: save ? { save } : undefined,
        body,
      }),
  });
};

export const useRequestEpisodeReview = () => {
  return useMutation<IEpisodeReviewResponse, Error, IEpisodeReviewRequest>({
    mutationFn: async (body: IEpisodeReviewRequest) =>
      apiClient.request<IEpisodeReviewResponse>({
        url: "/v1/command/episodes/review-requests",
        method: "POST",
        body,
      }),
  });
};

export const useCancelEpisodeReview = () => {
  return useMutation<
    IEpisodeReviewCancelResponse,
    Error,
    IEpisodeReviewCancelRequest
  >({
    mutationFn: async (body: IEpisodeReviewCancelRequest) =>
      apiClient.request<IEpisodeReviewCancelResponse>({
        url: "/v1/command/episodes/review-requests/cancel",
        method: "POST",
        body,
      }),
  });
};

export const useDeleteEpisodes = () => {
  return useMutation<IEpisodeDeleteResponse, Error, IEpisodeDeleteRequest>({
    mutationFn: async (body: IEpisodeDeleteRequest) =>
      apiClient.request<IEpisodeDeleteResponse>({
        url: "/v1/command/episodes/delete",
        method: "POST",
        body,
      }),
  });
};

export const useStartEpisodeSale = () => {
  return useMutation<IEpisodeSaleResponse, Error, IEpisodeSaleStartRequest>({
    mutationFn: async (body: IEpisodeSaleStartRequest) =>
      apiClient.request<IEpisodeSaleResponse>({
        url: "/v1/command/episodes/sale-start",
        method: "POST",
        body,
      }),
  });
};

export const useReserveEpisodeSale = () => {
  return useMutation<IEpisodeSaleResponse, Error, IEpisodeSaleReserveRequest>({
    mutationFn: async (body: IEpisodeSaleReserveRequest) =>
      apiClient.request<IEpisodeSaleResponse>({
        url: "/v1/command/episodes/sale-reserve",
        method: "POST",
        body,
      }),
  });
};

export const useCancelReserveEpisodeSale = () => {
  return useMutation<IEpisodeSaleResponse, Error, IEpisodeSaleReserveCancelRequest>({
    mutationFn: async (body: IEpisodeSaleReserveCancelRequest) =>
      apiClient.request<IEpisodeSaleResponse>({
        url: "/v1/command/episodes/sale-reserve-cancel",
        method: "POST",
        body,
      }),
  });
};

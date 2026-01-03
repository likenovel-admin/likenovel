"use client";

import {
  IDeleteCommentResponse,
  IDeleteNoticeResponse,
  IDeleteReviewResponse,
  IGetGetCommentDetailResponse,
  IGetGetNoticeDetailResponse,
  IGetGetReviewDetailResponse,
  IGetReviewCommentNoticeAllResponse,
  IGetReviewCommentNoticeParams,
  IGetReviewCommentNoticeResponse,
  IUpdateCommentRequest,
  IUpdateCommentResponse,
  IUpdateNoticeRequest,
  IUpdateNoticeResponse,
  IUpdateReviewRequest,
  IUpdateReviewResponse,
} from "@/api/reviewCommentNotice/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetReviewCommentNotice = (
  params: IGetReviewCommentNoticeParams
) => {
  return useQuery<IGetReviewCommentNoticeResponse>({
    queryKey: ["GetReviewCommentNotice", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetReviewCommentNoticeResponse>({
        url: "/v1/query/admins/reviews-comments-notices",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getReviewCommentNoticeDownload = async (
  params: IGetReviewCommentNoticeParams
) => {
  const res = await apiClient.request<IGetReviewCommentNoticeAllResponse>({
    url: "/v1/query/admins/reviews-comments-notices/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetNoticeDetail = (id: string) => {
  return useQuery<IGetGetNoticeDetailResponse>({
    queryKey: ["GetNoticeDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetGetNoticeDetailResponse>({
        url: "/v1/query/admins/notices/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useUpdateNotice = () => {
  return useMutation<
    IUpdateNoticeResponse,
    Error,
    { id: string; body: IUpdateNoticeRequest }
  >({
    mutationFn: async (data: { id: string; body: IUpdateNoticeRequest }) => {
      return await apiClient.request<IUpdateNoticeResponse>({
        url: `/v1/command/admins/notices/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useDeleteNotice = () => {
  return useMutation<IDeleteNoticeResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteNoticeResponse>({
        url: `/v1/command/admins/notices/${id}`,
        method: "DELETE",
      });
    },
  });
};

export const useGetCommentDetail = (id: string) => {
  return useQuery<IGetGetCommentDetailResponse>({
    queryKey: ["GetCommentDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetGetCommentDetailResponse>({
        url: "/v1/query/admins/comments/" + id,
        method: "GET",
      });
      return res;
    },
  });
};

export const useUpdateComment = () => {
  return useMutation<
    IUpdateCommentResponse,
    Error,
    { id: string; body: IUpdateCommentRequest }
  >({
    mutationFn: async (data: { id: string; body: IUpdateCommentRequest }) => {
      return await apiClient.request<IUpdateCommentResponse>({
        url: `/v1/command/admins/comments/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useDeleteComment = () => {
  return useMutation<IDeleteCommentResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteCommentResponse>({
        url: `/v1/command/admins/comments/${id}`,
        method: "DELETE",
      });
    },
  });
};

export const useGetReviewDetail = (id: string) => {
  return useQuery<IGetGetReviewDetailResponse>({
    queryKey: ["GetReviewDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetGetReviewDetailResponse>({
        url: "/v1/query/admins/reviews/" + id,
        method: "GET",
      });
      return res;
    },
    enabled: !!id,
  });
};

export const useUpdateReview = () => {
  return useMutation<
    IUpdateReviewResponse,
    Error,
    { id: string; body: IUpdateReviewRequest }
  >({
    mutationFn: async (data: { id: string; body: IUpdateReviewRequest }) => {
      return await apiClient.request<IUpdateReviewResponse>({
        url: `/v1/command/admins/reviews/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useDeleteReview = () => {
  return useMutation<IDeleteReviewResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteReviewResponse>({
        url: `/v1/command/admins/reviews/${id}`,
        method: "DELETE",
      });
    },
  });
};

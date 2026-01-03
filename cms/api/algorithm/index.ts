"use client";
import {
  IGetAlgorithmParams,
  IGetAlgorithmSectionsResponse,
  IGetAlgorithmSetTopicResponse,
  IGetAlgorithmSimilarResponse,
  IGetAlgorithmUserResponse,
  IUpdateAlgorithmSectionRequest,
  IUpdateAlgorithmSectionResponse,
} from "@/api/algorithm/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAlgorithmUsers = (
  params: IGetAlgorithmParams,
  enabled: boolean
) => {
  return useQuery<IGetAlgorithmUserResponse>({
    queryKey: ["GetAlgorithmUser", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetAlgorithmUserResponse>({
        url: "/v1/query/admins/algorithm-recommend/users",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled,
  });
};

export const downloadCSVUsers = async () => {
  const res = await apiClient.request<string>({
    url: "/v1/query/admins/algorithm-recommend/users/format",
    method: "GET",
    responseType: "blob",
  });
  return res;
};

export const uploadCSVUsers = async (form: FormData) => {
  const res = await apiClient.request<string>({
    url: "/v1/command/admins/algorithm-recommend/users/upload",
    method: "POST",
    isFile: true,
    body: form,
  });
  return res;
};

export const useGetAlgorithmSetTopics = (
  params: IGetAlgorithmParams,
  enabled: boolean
) => {
  return useQuery<IGetAlgorithmSetTopicResponse>({
    queryKey: ["GetAlgorithmSetTopic", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetAlgorithmSetTopicResponse>({
        url: "/v1/query/admins/algorithm-recommend/set-topic",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled,
  });
};

export const downloadCSVSetTopics = async () => {
  const res = await apiClient.request<string>({
    url: "/v1/query/admins/algorithm-recommend/set-topic/format",
    method: "GET",
    responseType: "blob",
  });
  return res;
};

export const uploadCSVSetTopic = async (form: FormData) => {
  const res = await apiClient.request<string>({
    url: "/v1/command/admins/algorithm-recommend/set-topic/upload",
    method: "POST",
    isFile: true,
    body: form,
  });
  return res;
};

export const useGetAlgorithmSections = (
  params: IGetAlgorithmParams,
  enabled: boolean
) => {
  return useQuery<IGetAlgorithmSectionsResponse>({
    queryKey: ["GetAlgorithmSections", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetAlgorithmSectionsResponse>({
        url: "/v1/query/admins/algorithm-recommend/sections",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled,
  });
};

export const useUpdateAlgorithmSection = () => {
  return useMutation<
    IUpdateAlgorithmSectionResponse,
    Error,
    { id: string; body: IUpdateAlgorithmSectionRequest }
  >({
    mutationFn: async (data: {
      id: string;
      body: IUpdateAlgorithmSectionRequest;
    }) => {
      return await apiClient.request<IUpdateAlgorithmSectionResponse>({
        url: `/v1/command/admins/algorithm-recommend/sections/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useGetAlgorithmSimilar = (
  { type, ...params }: IGetAlgorithmParams,
  enabled: boolean
) => {
  return useQuery<IGetAlgorithmSimilarResponse>({
    queryKey: ["GetAlgorithmSections", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetAlgorithmSimilarResponse>({
        url: `/v1/query/admins/algorithm-recommend/similar/${type}`,
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled,
  });
};

export const downloadCSVSimilar = async (type: string) => {
  const res = await apiClient.request<string>({
    url: `/v1/query/admins/algorithm-recommend/similar/${type}/format`,
    method: "GET",
    responseType: "blob",
  });
  return res;
};

export const uploadCSVSimilar = async (data: {
  type: string;
  form: FormData;
}) => {
  const res = await apiClient.request<string>({
    url: `/v1/command/admins/algorithm-recommend/similar/${data.type}/upload`,
    method: "POST",
    isFile: true,
    body: data.form,
  });
  return res;
};

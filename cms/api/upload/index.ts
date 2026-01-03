"use client";

import {
  ICreateUploadResponse,
  ISelectPresignedFilePathResponseByEpisode,
  ISelectStoragePathResponse,
  IUpdateUploadResponse,
} from "@/api/upload/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreateUpload = () => {
  return useMutation<
    ICreateUploadResponse,
    Error,
    { group_type: string; file_name: string }
  >({
    mutationFn: async (data: { group_type: string; file_name: string }) => {
      return await apiClient.request<ICreateUploadResponse>({
        url: `/v1/command/storages/upload-url`,
        method: "POST",
        body: data,
      });
    },
  });
};

export const useUpdateUpload = () => {
  return useMutation<
    IUpdateUploadResponse,
    Error,
    { url: string; file: File; file_type: string }
  >({
    mutationFn: async (data: {
      url: string;
      file: File;
      file_type: string;
    }) => {
      return await apiClient.request<IUpdateUploadResponse>({
        url: data.url,
        method: "PUT",
        body: data.file,
        isFile: true,
        isFullUrl: true,
        notAuth: true,
        responseType: "none",
        headers: {
          "Content-Type": data.file_type || "application/octet-stream",
        },
      });
    },
  });
};

export const useSelectPresignedFilePathByEpisode = () => {
  return useMutation<ISelectPresignedFilePathResponseByEpisode, Error, string>({
    mutationFn: async (fileName: string) => {
      return await apiClient.request<ISelectPresignedFilePathResponseByEpisode>({
        url: `/v1/query/episodes/episode/upload/${fileName}`,
        method: "GET",
      });
    },
  });
};

export const useSelectStoragePath = () => {
  return useMutation<ISelectStoragePathResponse, Error, number>({
    mutationFn: async (fileId: number) => {
      return await apiClient.request<ISelectStoragePathResponse>({
        url: `/v1/query/episodes/episode/download/${fileId}`,
        method: "GET",
      });
    },
  });
};

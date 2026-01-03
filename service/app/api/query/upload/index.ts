"use client";

import { instance } from "@/app/api/axios";
import {
  ICreateUploadResponse,
  IUpdateUploadResponse,
} from "@/app/api/query/upload/dto";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useCreateUpload = () => {
  return useMutation<
    ICreateUploadResponse,
    Error,
    { group_type: string; file_name: string }
  >({
    mutationFn: async (data: { group_type: string; file_name: string }) => {
      const response = await instance.post<ICreateUploadResponse>(
        `/v1/command/storages/upload-url`,
        data
      );
      return response.data;
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
      const response = await axios.put<IUpdateUploadResponse>(
        data.url,
        data.file,
        {
          headers: {
            "Content-Type": data.file_type || "application/octet-stream",
          },
        }
      );
      return response.data;
    },
  });
};

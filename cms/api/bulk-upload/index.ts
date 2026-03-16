"use client";

import {
  IBulkUploadPreviewResponse,
  IBulkUploadExecuteResponse,
} from "@/api/bulk-upload/dto";
import apiClient from "@/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

export const useBulkUploadPreview = () => {
  return useMutation<IBulkUploadPreviewResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      return await apiClient.request<IBulkUploadPreviewResponse>({
        url: "/v1/command/admins/bulk-upload/preview",
        method: "POST",
        body: formData,
        isFile: true,
      });
    },
  });
};

export const useBulkUploadExecute = () => {
  return useMutation<IBulkUploadExecuteResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      return await apiClient.request<IBulkUploadExecuteResponse>({
        url: "/v1/command/admins/bulk-upload/execute",
        method: "POST",
        body: formData,
        isFile: true,
      });
    },
  });
};

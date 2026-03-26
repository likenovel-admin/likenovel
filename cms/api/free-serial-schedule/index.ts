"use client";

import { IFreeSerialScheduleResponse } from "@/api/free-serial-schedule/dto";
import apiClient from "@/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

export const useFreeSerialSchedulePreview = () => {
  return useMutation<IFreeSerialScheduleResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      return await apiClient.request<IFreeSerialScheduleResponse>({
        url: "/v1/command/admins/free-serial-schedule/preview",
        method: "POST",
        body: formData,
        isFile: true,
      });
    },
  });
};

export const useFreeSerialScheduleApply = () => {
  return useMutation<IFreeSerialScheduleResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      return await apiClient.request<IFreeSerialScheduleResponse>({
        url: "/v1/command/admins/free-serial-schedule/apply",
        method: "POST",
        body: formData,
        isFile: true,
      });
    },
  });
};

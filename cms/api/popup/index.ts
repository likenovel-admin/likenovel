"use client";

import {
  IEditPopupResponse,
  IGetPopupDetailResponse,
  IPopupRequest,
} from "@/api/popup/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetPopupDetail = () => {
  return useQuery<IGetPopupDetailResponse>({
    queryKey: ["GetPopupDetail"],

    queryFn: async () => {
      const res = await apiClient.request<IGetPopupDetailResponse>({
        url: "/v1/query/admins/popup",
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditPopup = () => {
  return useMutation<IEditPopupResponse, Error, IPopupRequest>({
    mutationFn: async (body: IPopupRequest) => {
      return await apiClient.request<IEditPopupResponse>({
        url: "/v1/command/admins/popup",
        method: "PUT",
        body: body,
      });
    },
  });
};

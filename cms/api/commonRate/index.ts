"use client";
import {
  ICommonRateRequest,
  IEditCommonRateResponse,
  IGetCommonRateResponse,
} from "@/api/commonRate/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetCommonRateDetail = () => {
  return useQuery<IGetCommonRateResponse>({
    queryKey: ["GetCommonRateDetail"],

    queryFn: async () => {
      const res = await apiClient.request<IGetCommonRateResponse>({
        url: "/v1/query/admins/common-rate",
        method: "GET",
      });
      return res;
    },
  });
};

export const useEditCommonRate = () => {
  return useMutation<IEditCommonRateResponse, Error, ICommonRateRequest>({
    mutationFn: async (body: ICommonRateRequest) => {
      return await apiClient.request<IEditCommonRateResponse>({
        url: "/v1/command/admins/common-rate",
        method: "POST",
        body: body,
      });
    },
  });
};

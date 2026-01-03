"use client";
import {
  IGetProductStatisticParams,
  IGetProductStatisticsResponse,
} from "@/api/product-statistics/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetProductStatistics = (params: IGetProductStatisticParams) => {
  return useQuery<IGetProductStatisticsResponse>({
    queryKey: ["GetProductStatisticParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductStatisticsResponse>({
        url: "/v1/query/partners/product-statistics",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadProductStatistics = async (
  params: IGetProductStatisticParams
) => {
  const res = await apiClient.request<IGetProductStatisticsResponse>({
    url: "/v1/query/partners/product-statistics/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

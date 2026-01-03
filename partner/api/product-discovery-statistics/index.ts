"use client";

import {
  IGetProductDiscoveryStatisticsDetailResponse,
  IGetProductDiscoveryStatisticsParams,
  IGetProductDiscoveryStatisticssResponse,
} from "@/api/product-discovery-statistics/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetProductDiscoveryStatistics = (
  params: IGetProductDiscoveryStatisticsParams
) => {
  return useQuery<IGetProductDiscoveryStatisticssResponse>({
    queryKey: ["GetProductDiscoveryStatisticsParams", JSON.stringify(params)],

    queryFn: async () => {
      const res =
        await apiClient.request<IGetProductDiscoveryStatisticssResponse>({
          url: "/v1/query/partners/product-discovery-statistics",
          method: "GET",
          queryParams: params,
        });
      return res;
    },
  });
};

export const getDownloadProductDiscoveryStatisticss = async (
  params: IGetProductDiscoveryStatisticsParams
) => {
  const res = await apiClient.request<IGetProductDiscoveryStatisticssResponse>({
    url: "/v1/query/partners/product-discovery-statistics/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetProductDiscoveryStatisticsDetail = (id: string) => {
  return useQuery<IGetProductDiscoveryStatisticsDetailResponse>({
    queryKey: ["GetProductDiscoveryStatisticsDetail", id],

    queryFn: async () => {
      const res =
        await apiClient.request<IGetProductDiscoveryStatisticsDetailResponse>({
          url: "/v1/query/partners/product-discovery-statistics/" + id,
          method: "GET",
        });
      return res;
    },
  });
};

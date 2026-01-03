"use client";
import {
  IGetProductEpisodeStatisticParams,
  IGetProductEpisodeStatisticsResponse,
} from "@/api/product-episode-statistics/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetProductEpisodeStatistics = (
  params: IGetProductEpisodeStatisticParams
) => {
  return useQuery<IGetProductEpisodeStatisticsResponse>({
    queryKey: ["GetProductEpisodeStatisticParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductEpisodeStatisticsResponse>(
        {
          url: "/v1/query/partners/product-episode-statistics",
          method: "GET",
          queryParams: params,
        }
      );
      return res;
    },
  });
};

export const getDownloadProductEpisodeStatistics = async (
  params: IGetProductEpisodeStatisticParams
) => {
  const res = await apiClient.request<IGetProductEpisodeStatisticsResponse>({
    url: "/v1/query/partners/product-episode-statistics/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

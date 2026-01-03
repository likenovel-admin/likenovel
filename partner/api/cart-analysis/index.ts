"use client";
import {
  IGetCartAnalysisParams,
  IGetCartAnalysissResponse,
} from "@/api/cart-analysis/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetCartAnalysiss = (params: IGetCartAnalysisParams) => {
  return useQuery<IGetCartAnalysissResponse>({
    queryKey: ["GetCartAnalysisParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetCartAnalysissResponse>({
        url: "/v1/query/partners/cart-analysis",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadCartAnalysiss = async (
  params: IGetCartAnalysisParams
) => {
  const res = await apiClient.request<IGetCartAnalysissResponse>({
    url: "/v1/query/partners/cart-analysis/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

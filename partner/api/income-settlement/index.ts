"use client";
import {
  IGetIncomeSettlementParams,
  IGetIncomeSettlementsResponse,
  IGetIncomeSettlementSummaryResponse,
} from "@/api/income-settlement/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetIncomeSettlements = (params: IGetIncomeSettlementParams) => {
  return useQuery<IGetIncomeSettlementsResponse>({
    queryKey: ["GetIncomeSettlementParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetIncomeSettlementsResponse>({
        url: "/v1/query/partners/income-settlement",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadIncomeSettlements = async (
  params: IGetIncomeSettlementParams
) => {
  const res = await apiClient.request<IGetIncomeSettlementsResponse>({
    url: "/v1/query/partners/income-settlement/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetIncomeSettlementSummary = (params: {
  search_month?: string;
}) => {
  return useQuery<IGetIncomeSettlementSummaryResponse>({
    queryKey: ["GetIncomeSettlementSummary", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetIncomeSettlementSummaryResponse>({
        url: "/v1/query/partners/income-settlement/summary",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

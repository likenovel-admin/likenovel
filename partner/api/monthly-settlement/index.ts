"use client";
import {
  IGetMonthlySettlementParams,
  IGetMonthlySettlementsResponse,
} from "@/api/monthly-settlement/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetMonthlySettlements = (
  params: IGetMonthlySettlementParams
) => {
  return useQuery<IGetMonthlySettlementsResponse>({
    queryKey: ["GetMonthlySettlementParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetMonthlySettlementsResponse>({
        url: "/v1/query/partners/monthly-settlement",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadMonthlySettlements = async (
  params: IGetMonthlySettlementParams
) => {
  const res = await apiClient.request<IGetMonthlySettlementsResponse>({
    url: "/v1/query/partners/monthly-settlement/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

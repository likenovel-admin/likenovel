"use client";

import {
  IGetIncomeRecodeParams,
  IGetIncomeRecodesResponse,
} from "@/api/income-recodes/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetIncomeRecodes = (params: IGetIncomeRecodeParams) => {
  return useQuery<IGetIncomeRecodesResponse>({
    queryKey: ["GetIncomeRecodeParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetIncomeRecodesResponse>({
        url: "/v1/query/partners/income-recodes",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadIncomeRecodes = async (
  params: IGetIncomeRecodeParams
) => {
  const res = await apiClient.request<IGetIncomeRecodesResponse>({
    url: "/v1/query/partners/income-recodes/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

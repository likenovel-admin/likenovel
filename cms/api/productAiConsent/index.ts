"use client";

import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import {
  IGetProductAiConsentParams,
  IGetProductAiConsentResponse,
} from "./dto";

export const useGetProductAiConsents = (
  params: IGetProductAiConsentParams
) => {
  return useQuery<IGetProductAiConsentResponse>({
    queryKey: ["GetProductAiConsents", JSON.stringify(params)],
    queryFn: async () => {
      const res = await apiClient.request<IGetProductAiConsentResponse>({
        url: "/v1/query/admins/product-ai-consents",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

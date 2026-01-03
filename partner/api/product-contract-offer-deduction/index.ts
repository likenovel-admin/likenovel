"use client";

import {
  IGetProductContractOfferDeductionParams,
  IGetProductContractOfferDeductionsResponse,
} from "@/api/product-contract-offer-deduction/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetProductContractOfferDeductions = (
  params: IGetProductContractOfferDeductionParams
) => {
  return useQuery<IGetProductContractOfferDeductionsResponse>({
    queryKey: [
      "GetProductContractOfferDeductionParams",
      JSON.stringify(params),
    ],

    queryFn: async () => {
      const res =
        await apiClient.request<IGetProductContractOfferDeductionsResponse>({
          url: "/v1/query/partners/monthly-sales-by-product",
          method: "GET",
          queryParams: params,
        });
      return res;
    },
  });
};

export const getDownloadProductContractOfferDeductions = async (
  params: IGetProductContractOfferDeductionParams
) => {
  const res =
    await apiClient.request<IGetProductContractOfferDeductionsResponse>({
      url: "/v1/query/partners/monthly-sales-by-product/all",
      method: "GET",
      queryParams: params,
    });
  return res;
};

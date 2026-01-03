"use client";

import { IGetProductParams, IGetProductResponse } from "@/api/product/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetProducts = (params: IGetProductParams) => {
  return useQuery<IGetProductResponse>({
    queryKey: ["GetProduct", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductResponse>({
        url: "/v1/query/partners/products",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getProductsSearch = async () => {
  const res = await apiClient.request<IGetProductResponse>({
    url: "/v1/query/admins/products/simple",
    method: "GET",
  });
  return res;
};

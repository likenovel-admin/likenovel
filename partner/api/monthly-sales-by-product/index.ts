"use client";

import {
  IGetMonthlySaleByProductDetailResponse,
  IGetMonthlySaleByProductParams,
  IGetMonthlySaleByProductsResponse,
  IUpdateMonthlySaleByProductBody,
  IUpdateMonthlySaleByProductResponse,
} from "@/api/monthly-sales-by-product/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetMonthlySaleByProducts = (
  params: IGetMonthlySaleByProductParams
) => {
  return useQuery<IGetMonthlySaleByProductsResponse>({
    queryKey: ["GetMonthlySaleByProductParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetMonthlySaleByProductsResponse>({
        url: "/v1/query/partners/monthly-sales-by-product",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadMonthlySaleByProducts = async (
  params: IGetMonthlySaleByProductParams
) => {
  const res = await apiClient.request<IGetMonthlySaleByProductsResponse>({
    url: "/v1/query/partners/monthly-sales-by-product/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetMonthlySaleByProductDetail = (id: string) => {
  return useQuery<IGetMonthlySaleByProductDetailResponse>({
    queryKey: ["GetMonthlySaleByProductDetail", JSON.stringify(id)],

    queryFn: async () => {
      const res =
        await apiClient.request<IGetMonthlySaleByProductDetailResponse>({
          url: "/v1/query/partners/monthly-sales-by-product/" + id,
          method: "GET",
        });
      return res;
    },
    enabled: !!id,
  });
};

export const getDownloadMonthlySaleByProductDetail = async (
  params: IGetMonthlySaleByProductParams & { id: string }
) => {
  const res = await apiClient.request<IGetMonthlySaleByProductsResponse>({
    url: `/v1/query/partners/monthly-sales-by-product${params.id}/all`,
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useUpdateMonthlySaleByProduct = () => {
  return useMutation<
    IUpdateMonthlySaleByProductResponse,
    Error,
    { id: string; body: IUpdateMonthlySaleByProductBody }
  >({
    mutationFn: async (data: {
      id: string;
      body: IUpdateMonthlySaleByProductBody;
    }) => {
      return await apiClient.request<IUpdateMonthlySaleByProductResponse>({
        url: `/v1/command/partners/monthly-sales-by-product/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

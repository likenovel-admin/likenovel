"use client";
import {
  IGetCPCompanyResponse,
  IGetProductDetailResponse,
  IGetProductGenreResponse,
  IGetProductParams,
  IGetProductsResponse,
  IUpdateProductRequest,
  IUpdateProductResponse,
} from "@/api/product/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetProducts = (params: IGetProductParams) => {
  return useQuery<IGetProductsResponse>({
    queryKey: ["GetProductParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductsResponse>({
        url: "/v1/query/partners/products",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadProducts = async (params: IGetProductParams) => {
  const res = await apiClient.request<IGetProductsResponse>({
    url: "/v1/query/partners/products/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetProductDetail = (id: string, enabled: boolean) => {
  return useQuery<IGetProductDetailResponse>({
    queryKey: ["GetProductDetail", JSON.stringify(id)],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductDetailResponse>({
        url: "/v1/query/partners/products/" + id,
        method: "GET",
      });
      return res;
    },
    enabled,
  });
};

export const useGetProductGenre = () => {
  return useQuery<IGetProductGenreResponse>({
    queryKey: ["GetProductGenre"],

    queryFn: async () => {
      const res = await apiClient.request<IGetProductGenreResponse>({
        url: "/v1/query/partners/products/genre",
        method: "GET",
      });
      return res;
    },
  });
};

export const useGetProductCpCompany = () => {
  return useQuery<IGetCPCompanyResponse>({
    queryKey: ["GetProductCpCompany"],

    queryFn: async () => {
      const res = await apiClient.request<IGetCPCompanyResponse>({
        url: "/v1/query/partners/products/cp-company",
        method: "GET",
      });
      return res;
    },
  });
};

export const useUpdateProduct = () => {
  return useMutation<
    IUpdateProductResponse,
    Error,
    {
      id: string;
      body: IUpdateProductRequest;
    }
  >({
    mutationFn: async (data: { id: string; body: IUpdateProductRequest }) => {
      return await apiClient.request<IUpdateProductResponse>({
        url: `/v1/command/partners/products/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useDeleteProduct = () => {
  return useMutation<IUpdateProductResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IUpdateProductResponse>({
        url: `/v1/command/partners/products/${id}`,
        method: "DELETE",
      });
    },
  });
};

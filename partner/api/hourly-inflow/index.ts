"use client";
import {
  IGetHourlyInflowDetailParams,
  IGetHourlyInflowDetailResponse,
  IGetHourlyInflowParams,
  IGetHourlyInflowsResponse,
} from "@/api/hourly-inflow/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetHourlyInflows = (params: IGetHourlyInflowParams) => {
  return useQuery<IGetHourlyInflowsResponse>({
    queryKey: ["GetHourlyInflowParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetHourlyInflowsResponse>({
        url: "/v1/query/partners/hourly-inflow",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadHourlyInflows = async (
  params: IGetHourlyInflowParams
) => {
  const res = await apiClient.request<IGetHourlyInflowsResponse>({
    url: "/v1/query/partners/hourly-inflow/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetHourlyInflowDetail = (
  id: string,
  params: IGetHourlyInflowDetailParams,
  enabled: boolean
) => {
  return useQuery<IGetHourlyInflowDetailResponse>({
    queryKey: ["GetHourlyInflowDetail", JSON.stringify(id)],

    queryFn: async () => {
      const res = await apiClient.request<IGetHourlyInflowDetailResponse>({
        url: "/v1/query/partners/hourly-inflow/" + id,
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled,
  });
};

export const getDownloadHourlyInflowDetail = async (
  params: IGetHourlyInflowDetailParams & { id: string }
) => {
  const res = await apiClient.request<IGetHourlyInflowDetailResponse>({
    url: "/v1/query/partners/hourly-inflow/" + params.id,
    method: "GET",
    queryParams: params,
  });
  return res;
};

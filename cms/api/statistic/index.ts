"use client";

import {
  IGetStatisticSiteAllResponse,
  IGetStatisticSiteParams,
  IGetStatisticSiteResponse,
  IGetStatisticPaymentParams,
  IGetStatisticPaymentResponse,
  IGetStatisticPaymentAllResponse,
  IGetStatisticPaymentByUserParams,
  IGetStatisticPaymentByUserResponse,
  IGetStatisticPaymentByUserAllResponse,
} from "@/api/statistic/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface ICancelCashOrderReqBody {
  reason?: string;
}

export const useGetStatisticSite = (params: IGetStatisticSiteParams) => {
  return useQuery<IGetStatisticSiteResponse>({
    queryKey: ["GetStatisticSite", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticSiteResponse>({
        url: "/v1/query/statistics/site",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getStatisticSiteDownload = async (
  params: IGetStatisticSiteParams
) => {
  const res = await apiClient.request<IGetStatisticSiteAllResponse>({
    url: "/v1/query/statistics/site/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetStatisticPayment = (params: IGetStatisticPaymentParams) => {
  return useQuery<IGetStatisticPaymentResponse>({
    queryKey: ["GetStatisticPayment", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticPaymentResponse>({
        url: "/v1/query/statistics/payment",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getStatisticPaymentDownload = async (
  params: IGetStatisticPaymentParams
) => {
  const res = await apiClient.request<IGetStatisticPaymentAllResponse>({
    url: "/v1/query/statistics/payment/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetStatisticPaymentByUser = (
  params: IGetStatisticPaymentByUserParams
) => {
  return useQuery<IGetStatisticPaymentByUserResponse>({
    queryKey: ["GetStatisticPaymentByUser", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticPaymentByUserResponse>({
        url: "/v1/query/statistics/payment-by-user",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getStatisticPaymentByUserDownload = async (
  params: IGetStatisticPaymentByUserParams
) => {
  const res = await apiClient.request<IGetStatisticPaymentByUserAllResponse>({
    url: "/v1/query/statistics/payment-by-user/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const cancelCashOrderByOrderId = async (
  orderId: number,
  body: ICancelCashOrderReqBody = {}
) => {
  const res = await apiClient.request<{ result: boolean; data?: any }>({
    url: `/v1/command/admins/cash-orders/${orderId}/cancel`,
    method: "POST",
    body,
  });
  return res;
};

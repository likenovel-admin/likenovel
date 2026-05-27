"use client";

import {
  IGetStatisticSiteAllResponse,
  IGetStatisticSiteParams,
  IGetStatisticSitePageReferrersParams,
  IGetStatisticSitePageReferrersResponse,
  IGetStatisticSitePageRoutesParams,
  IGetStatisticSitePageRoutesResponse,
  IGetStatisticSiteResponse,
  IGetStatisticPaymentParams,
  IGetStatisticPaymentResponse,
  IGetStatisticPaymentAllResponse,
  IGetStatisticPaymentByUserParams,
  IGetStatisticPaymentByUserResponse,
  IGetStatisticPaymentByUserAllResponse,
  IGetStatisticWebsochatUsageParams,
  IGetStatisticWebsochatUsageResponse,
  IGetStatisticAiReaderEngagementParams,
  IGetStatisticAiReaderEngagementResponse,
  IGetStatisticAiReaderAgentActionsParams,
  IGetStatisticAiReaderAgentActionsResponse,
  IGetStatisticAiReaderTimelineParams,
  IGetStatisticAiReaderTimelineResponse,
  IGetStatisticAiApiUsageParams,
  IGetStatisticAiApiUsageResponse,
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

export const useGetStatisticSitePageRoutes = (
  params: IGetStatisticSitePageRoutesParams
) => {
  return useQuery<IGetStatisticSitePageRoutesResponse>({
    queryKey: ["GetStatisticSitePageRoutes", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticSitePageRoutesResponse>({
        url: "/v1/query/statistics/site-page-routes",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getStatisticSitePageRoutesDownload = async (
  params: IGetStatisticSitePageRoutesParams
) => {
  const res = await apiClient.request<IGetStatisticSitePageRoutesResponse>({
    url: "/v1/query/statistics/site-page-routes",
    method: "GET",
    queryParams: {
      ...params,
      page: -1,
      count_per_page: -1,
    },
  });
  return res;
};

export const useGetStatisticSitePageReferrers = (
  params: IGetStatisticSitePageReferrersParams
) => {
  return useQuery<IGetStatisticSitePageReferrersResponse>({
    queryKey: ["GetStatisticSitePageReferrers", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticSitePageReferrersResponse>({
        url: "/v1/query/statistics/site-page-referrers",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getStatisticSitePageReferrersDownload = async (
  params: IGetStatisticSitePageReferrersParams
) => {
  const res = await apiClient.request<IGetStatisticSitePageReferrersResponse>({
    url: "/v1/query/statistics/site-page-referrers",
    method: "GET",
    queryParams: {
      ...params,
      page: -1,
      count_per_page: -1,
    },
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

export const useGetStatisticWebsochatUsage = (
  params: IGetStatisticWebsochatUsageParams
) => {
  return useQuery<IGetStatisticWebsochatUsageResponse>({
    queryKey: ["GetStatisticWebsochatUsage", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticWebsochatUsageResponse>({
        url: "/v1/query/statistics/websochat-usage",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetStatisticAiReaderEngagement = (
  params: IGetStatisticAiReaderEngagementParams,
  refetchInterval = 60000
) => {
  return useQuery<IGetStatisticAiReaderEngagementResponse>({
    queryKey: ["GetStatisticAiReaderEngagement", JSON.stringify(params)],
    refetchInterval,
    refetchIntervalInBackground: false,

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticAiReaderEngagementResponse>({
        url: "/v1/query/statistics/ai-reader-engagement",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetStatisticAiReaderAgentActions = (
  params: IGetStatisticAiReaderAgentActionsParams,
  enabled = true
) => {
  const { agent_id, ...queryParams } = params;
  return useQuery<IGetStatisticAiReaderAgentActionsResponse>({
    queryKey: ["GetStatisticAiReaderAgentActions", agent_id, JSON.stringify(queryParams)],
    enabled: enabled && Number.isFinite(agent_id) && agent_id > 0,

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticAiReaderAgentActionsResponse>({
        url: `/v1/query/statistics/ai-reader-engagement/agents/${agent_id}/actions`,
        method: "GET",
        queryParams,
      });
      return res;
    },
  });
};

export const useGetStatisticAiReaderTimeline = (
  params: IGetStatisticAiReaderTimelineParams,
  refetchInterval = 30000
) => {
  return useQuery<IGetStatisticAiReaderTimelineResponse>({
    queryKey: ["GetStatisticAiReaderTimeline", JSON.stringify(params)],
    refetchInterval,
    refetchIntervalInBackground: false,

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticAiReaderTimelineResponse>({
        url: "/v1/query/statistics/ai-reader-engagement/actions",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useGetStatisticAiApiUsage = (
  params: IGetStatisticAiApiUsageParams
) => {
  return useQuery<IGetStatisticAiApiUsageResponse>({
    queryKey: ["GetStatisticAiApiUsage", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetStatisticAiApiUsageResponse>({
        url: "/v1/query/statistics/ai-api-usage",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
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

"use client";

import {
  IAcceptApplyRankResponse,
  IApplyPaidConversionRequest,
  IApplyPaidConversionResponse,
  IDenyApplyRankResponse,
  IGetApplyRankParams,
  IGetApplyRankResponse,
} from "@/api/applyRank/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetApplyRank = (params: IGetApplyRankParams) => {
  return useQuery<IGetApplyRankResponse>({
    queryKey: ["GetApplyRank", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetApplyRankResponse>({
        url: "/v1/query/admins/apply-rank-up",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useAcceptApplyRank = () => {
  return useMutation<IAcceptApplyRankResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IAcceptApplyRankResponse>({
        url: `/v1/command/admins/apply-rank-up/${id}/accept`,
        method: "POST",
      });
    },
  });
};

export const useDenyApplyRank = () => {
  return useMutation<IDenyApplyRankResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDenyApplyRankResponse>({
        url: `/v1/command/admins/apply-rank-up/${id}/deny`,
        method: "POST",
      });
    },
  });
};

export const useApplyPaidConversion = () => {
  return useMutation<
    IApplyPaidConversionResponse,
    Error,
    IApplyPaidConversionRequest
  >({
    mutationFn: async ({ id, paidEpisodeNo }) => {
      return await apiClient.request<IApplyPaidConversionResponse>({
        url: `/v1/command/admins/apply-rank-up/${id}/apply-paid`,
        method: "POST",
        body: {
          paid_episode_no: paidEpisodeNo,
        },
      });
    },
  });
};

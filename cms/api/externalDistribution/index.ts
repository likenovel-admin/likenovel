"use client";

import {
  IAddExternalDistributionRequest,
  IGetExternalDistributionsParams,
  IGetExternalDistributionsResponse,
} from "@/api/externalDistribution/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetExternalDistributions = (
  params: IGetExternalDistributionsParams
) => {
  return useQuery<IGetExternalDistributionsResponse>({
    queryKey: ["GetExternalDistributions", JSON.stringify(params)],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page: params.page,
        count_per_page: params.count_per_page,
      };
      if (params.platform) queryParams.platform = params.platform;
      return await apiClient.request<IGetExternalDistributionsResponse>({
        url: "/v1/query/admins/external-distributions",
        method: "GET",
        queryParams,
      });
    },
  });
};

export const useAddExternalDistribution = () => {
  return useMutation<unknown, Error, IAddExternalDistributionRequest>({
    mutationFn: async (body) =>
      await apiClient.request({
        url: "/v1/command/admins/external-distributions",
        method: "POST",
        body,
      }),
  });
};

export const useUpdateExternalDistributionStatus = () => {
  return useMutation<unknown, Error, { id: number; status: "active" | "hidden" }>({
    mutationFn: async ({ id, status }) =>
      await apiClient.request({
        url: "/v1/command/admins/external-distributions/" + id,
        method: "PUT",
        body: { status },
      }),
  });
};

export const useDeleteExternalDistribution = () => {
  return useMutation<unknown, Error, number>({
    mutationFn: async (id) =>
      await apiClient.request({
        url: "/v1/command/admins/external-distributions/" + id,
        method: "DELETE",
      }),
  });
};

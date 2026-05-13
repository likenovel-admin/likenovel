"use client";

import {
  IAiReaderBootstrapRequest,
  IAiReaderBootstrapResponse,
  IAiReaderPauseAllResponse,
  IAiReaderResumePausedRequest,
  IAiReaderResumePausedResponse,
  IAiReaderScheduleRequest,
  IAiReaderScheduleResponse,
  IGetAiReaderAgentsParams,
  IGetAiReaderAgentsResponse,
} from "@/api/aiReader/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetAiReaderAgents = (params: IGetAiReaderAgentsParams) => {
  return useQuery<IGetAiReaderAgentsResponse>({
    queryKey: ["GetAiReaderAgents", JSON.stringify(params)],
    queryFn: async () => {
      return await apiClient.request<IGetAiReaderAgentsResponse>({
        url: "/v1/query/admins/ai-readers",
        method: "GET",
        queryParams: params,
      });
    },
  });
};

export const useBootstrapAiReaderAgents = () => {
  return useMutation<IAiReaderBootstrapResponse, Error, IAiReaderBootstrapRequest>({
    mutationFn: async (body: IAiReaderBootstrapRequest) => {
      return await apiClient.request<IAiReaderBootstrapResponse>({
        url: "/v1/command/admins/ai-readers/bootstrap",
        method: "POST",
        body,
      });
    },
  });
};

export const useUpdateAiReaderSchedule = () => {
  return useMutation<
    IAiReaderScheduleResponse,
    Error,
    { aiReaderAgentId: number; body: IAiReaderScheduleRequest }
  >({
    mutationFn: async ({ aiReaderAgentId, body }) => {
      return await apiClient.request<IAiReaderScheduleResponse>({
        url: `/v1/command/admins/ai-readers/${aiReaderAgentId}/schedule`,
        method: "PUT",
        body,
      });
    },
  });
};

export const usePauseAllAiReaderAgents = () => {
  return useMutation<IAiReaderPauseAllResponse, Error, void>({
    mutationFn: async () => {
      return await apiClient.request<IAiReaderPauseAllResponse>({
        url: "/v1/command/admins/ai-readers/pause-all",
        method: "POST",
      });
    },
  });
};

export const useResumePausedAiReaderAgents = () => {
  return useMutation<IAiReaderResumePausedResponse, Error, IAiReaderResumePausedRequest>({
    mutationFn: async (body: IAiReaderResumePausedRequest) => {
      return await apiClient.request<IAiReaderResumePausedResponse>({
        url: "/v1/command/admins/ai-readers/resume-paused",
        method: "POST",
        body,
      });
    },
  });
};

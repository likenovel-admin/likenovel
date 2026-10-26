"use client";

import apiClient from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AiModelSettingsResponse,
  UpdateAiModelRequest,
  UpdateAiModelResponse,
} from "./dto";

export const AI_MODEL_SETTINGS_QUERY_KEY = ["AiModelSettings"] as const;

export const useGetAiModelSettings = () =>
  useQuery<AiModelSettingsResponse>({
    queryKey: AI_MODEL_SETTINGS_QUERY_KEY,
    queryFn: () =>
      apiClient.request<AiModelSettingsResponse>({
        url: "/v1/query/admins/ai-models",
        method: "GET",
      }),
  });

export const useApplyAiModelSetting = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateAiModelResponse,
    Error,
    { featureKey: string; body: UpdateAiModelRequest }
  >({
    mutationFn: ({ featureKey, body }) =>
      apiClient.request<UpdateAiModelResponse>({
        url: `/v1/command/admins/ai-models/${encodeURIComponent(featureKey)}`,
        method: "PUT",
        body,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<AiModelSettingsResponse>(
        AI_MODEL_SETTINGS_QUERY_KEY,
        (current) => {
          if (!current) return current;
          return {
            data: {
              ...current.data,
              items: current.data.items.map((item) =>
                item.feature_key === response.data.feature_key
                  ? { ...item, ...response.data }
                  : item
              ),
            },
          };
        }
      );
    },
  });
};

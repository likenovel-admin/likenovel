"use client";
import {
  IGetCmsProductEvaluationParams,
  IGetCmsProductEvaluationResponse,
  IUpsertCmsProductEvaluationRequest,
  IUpsertCmsProductEvaluationResponse,
} from "@/api/cmsProductEvaluation/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetCmsProductEvaluations = (
  params: IGetCmsProductEvaluationParams
) => {
  return useQuery<IGetCmsProductEvaluationResponse>({
    queryKey: ["GetCmsProductEvaluations", JSON.stringify(params)],
    queryFn: async () => {
      const res = await apiClient.request<IGetCmsProductEvaluationResponse>({
        url: "/v1/query/admins/cms-product-evaluation",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const useUpsertCmsProductEvaluation = () => {
  return useMutation<
    IUpsertCmsProductEvaluationResponse,
    Error,
    IUpsertCmsProductEvaluationRequest
  >({
    mutationFn: async (body: IUpsertCmsProductEvaluationRequest) => {
      return await apiClient.request<IUpsertCmsProductEvaluationResponse>({
        url: "/v1/command/admins/cms-product-evaluation",
        method: "POST",
        body,
      });
    },
  });
};

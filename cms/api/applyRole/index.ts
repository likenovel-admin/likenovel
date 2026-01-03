"use client";

import {
  IGetApplyRoleAllResponse,
  IGetApplyRoleParams,
  IGetApplyRoleResponse,
  IAcceptApplyRoleResponse,
  IDenyApplyRoleResponse,
} from "@/api/applyRole/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetApplyRole = (params: IGetApplyRoleParams) => {
  return useQuery<IGetApplyRoleResponse>({
    queryKey: ["GetApplyRole", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetApplyRoleResponse>({
        url: "/v1/query/admins/apply-role",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getApplyRoleDownload = async (params: IGetApplyRoleParams) => {
  const res = await apiClient.request<IGetApplyRoleAllResponse>({
    url: "/v1/query/admins/apply-role/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useAcceptApplyRole = () => {
  return useMutation<IAcceptApplyRoleResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IAcceptApplyRoleResponse>({
        url: `/v1/command/admins/apply-role/${id}/accept`,
        method: "POST",
      });
    },
  });
};

export const useDenyApplyRole = () => {
  return useMutation<IDenyApplyRoleResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDenyApplyRoleResponse>({
        url: `/v1/command/admins/apply-role/${id}/deny`,
        method: "POST",
      });
    },
  });
};

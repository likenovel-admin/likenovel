"use client";

import {
  IDeleteProfileResponse,
  IEditAdminRightRequest,
  IEditAdminRightResponse,
  IGetUserAllResponse,
  IGetUserDetailResponse,
  IGetUserParams,
  IGetUserResponse,
  IResetPasswordRequest,
  IResetPasswordResponse,
  ISignOffResponse,
} from "@/api/user/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetUser = (params: IGetUserParams) => {
  return useQuery<IGetUserResponse>({
    queryKey: ["GetUser", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetUserResponse>({
        url: "/v1/query/admins/users",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getUserDownload = async (params: IGetUserParams) => {
  const res = await apiClient.request<IGetUserAllResponse>({
    url: "/v1/query/admins/users/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetUserDetail = (id: string) => {
  return useQuery<IGetUserDetailResponse>({
    queryKey: ["GetUserDetail", id],

    queryFn: async () => {
      const res = await apiClient.request<IGetUserDetailResponse>({
        url: "/v1/query/admins/users/" + id,
        method: "GET",
      });
      return res;
    },
    enabled: !!id,
  });
};

export const useResetPassword = () => {
  return useMutation<
    IResetPasswordResponse,
    Error,
    { id: string; body: IResetPasswordRequest }
  >({
    mutationFn: async (data: { id: string; body: IResetPasswordRequest }) => {
      return await apiClient.request<IResetPasswordResponse>({
        url: `/v1/command/admins/users/${data.id}/password/reset`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useEditAdminRight = () => {
  return useMutation<
    IEditAdminRightResponse,
    Error,
    { id: string; body: IEditAdminRightRequest }
  >({
    mutationFn: async (data: { id: string; body: IEditAdminRightRequest }) => {
      return await apiClient.request<IEditAdminRightResponse>({
        url: "/v1/command/admins/users/" + data.id,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useSignOff = () => {
  return useMutation<ISignOffResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<ISignOffResponse>({
        url: `/v1/command/admins/users/${id}/signoff`,
        method: "PUT",
      });
    },
  });
};

export const useDeleteProfile = () => {
  return useMutation<IDeleteProfileResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IDeleteProfileResponse>({
        url: "/v1/command/user/profiles/" + id,
        method: "DELETE",
      });
    },
  });
};

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../axios";
import {
  IEmailSignUpRequest,
  IPasswordResetRequest,
  ISelectUserResponse,
  ISignInRequest,
  ISignInResponse,
} from "./dto";

export const useEmailSignIn = () => {
  return useMutation<ISignInResponse, Error, ISignInRequest>({
    mutationFn: async (data: ISignInRequest) => {
      return await instance.post("/v1/command/auth/signin", data);
    },
  });
};

export const useCheckEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      return await instance.post("/v1/command/auth/email/duplicate-check", {
        email,
      });
    },
  });
};

export const useEmailSignUp = () => {
  return useMutation({
    mutationFn: async (data: IEmailSignUpRequest) => {
      return await instance.post("/v1/command/auth/signup", data);
    },
  });
};

export const useSignOut = () => {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      return await instance.post("/v1/command/auth/signout", {
        refresh_token: refreshToken,
      });
    },
  });
};

export const useSelectUser = () => {
  return useQuery<ISelectUserResponse>({
    queryKey: ["selectUser"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user");
      return response.data;
    },
  });
};

export const usePasswordReset = () => {
  return useMutation({
    mutationFn: async (data: IPasswordResetRequest) => {
      return await instance.put(
        "/v1/command/auth/identity/password/reset",
        data
      );
    },
  });
};

export const useIdentityPasswordAuth = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return await instance.post(
        "/v1/command/auth/identity/password/reset",
        data
      );
    },
  });
};

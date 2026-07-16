import { instance } from "@/app/api/axios";
import { ISelectMyEvaluationResponse } from "@/app/api/query/episode/dto";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IMakeProductRequest,
  ISelectAuthorProductsResponse,
  ISelectEpisodeCountResponse,
  ISelectGenresResponse,
  ISelectMakingProductResponse,
  ISelectMySummaryResponse,
  ISelectPresignedFilePathResponse,
  IProductMutationResponse,
  IUpdateProductRequest,
  IValidateCpNicknameResponse,
} from "./dto";
import type { AxiosResponse } from "axios";

export const useSelectPresignedFilePath = () => {
  return useMutation<ISelectPresignedFilePathResponse, Error, string>({
    mutationFn: async (fileName: string) => {
      const response = await instance.get(
        `/v1/query/products/cover/upload/${fileName}`
      );
      return response.data;
    },
  });
};

export const useSelectGenres = () => {
  return useQuery<ISelectGenresResponse>({
    queryKey: ["selectGenres"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/genres");
      return response.data;
    },
  });
};

export const useSelectTags = () => {
  return useQuery({
    queryKey: ["selectTags"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/keywords");
      return response.data;
    },
  });
};

export const useSelectEpisodeCount = () => {
  return useMutation<ISelectEpisodeCountResponse, Error, number>({
    mutationFn: async (productId: number) => {
      const response = await instance.get(
        `/v1/query/products/${productId}/episodes/count`
      );
      return response.data;
    },
  });
};

export const useCanCreateNormal = (enabled: boolean) => {
  return useQuery<{ can_create_normal: boolean }>({
    queryKey: ["canCreateNormal"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/can-create-normal");
      return response.data;
    },
    enabled,
  });
};

export const useValidateCpNickname = () => {
  return useMutation<IValidateCpNicknameResponse, Error, string>({
    mutationFn: async (nickname: string) => {
      const response = await instance.get(
        `/v1/query/products/cp-nickname/validate`,
        {
          params: { nickname },
        }
      );
      return response.data;
    },
  });
};

export const useMakeProduct = () => {
  return useMutation<AxiosResponse<IProductMutationResponse>, Error, IMakeProductRequest>({
    mutationFn: async (data: IMakeProductRequest) => {
      return await instance.post<IProductMutationResponse>(
        "/v1/command/products",
        data
      );
    },
  });
};

export const useSelectMakingProduct = () => {
  return useMutation<ISelectMakingProductResponse, Error, number>({
    mutationFn: async (productId: number) => {
      const response = await instance.get(
        `/v1/query/products/${productId}/info`
      );
      return response.data;
    },
  });
};

export const useUpdateProduct = () => {
  return useMutation<
    unknown,
    Error,
    { productId: number; data: IUpdateProductRequest }
  >({
    mutationFn: async ({ productId, data }) => {
      return await instance.put(`/v1/command/products/${productId}`, data);
    },
  });
};

export const useSelectAuthorProducts = (
  authorId: number,
  productId: number,
  adult_yn?: string,
  enabled: boolean = true
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<ISelectAuthorProductsResponse>({
    queryKey: ["selectAuthorProducts", authorId, productId, adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/author/others?author_id=${authorId}&exclude_product_id=${productId}&adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    enabled: enabled && !!authorId && !!productId,
  });
};

export const useMySummary = () => {
  return useQuery<ISelectMySummaryResponse>({
    queryKey: ["mySummary"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/user/summary`);
      return response.data;
    },
  });
};

export const useMyEvaluation = () => {
  return useQuery<ISelectMyEvaluationResponse>({
    queryKey: ["myEvaluation"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/user/evaluation`);
      return response.data;
    },
  });
};

export const useGetMyProducts = () => {
  return useQuery<ISelectAuthorProductsResponse, unknown>({
    queryKey: ["getMyProducts"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/products");
      return response.data;
    },
  });
};

export const useUpdateConversionProduct = () => {
  return useMutation<
    unknown,
    Error,
    { productId: number; category: "rank-up" | "paid" }
  >({
    mutationFn: async ({ productId, category }) => {
      return await instance.put(
        `/v1/command/products/${productId}/conversion?category=${category}`
      );
    },
  });
};

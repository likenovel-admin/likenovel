import { useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import {
  IAiChatRequest,
  IAiChatResponse,
  IAiRecommendResponse,
  IGetChatHistoryResponse,
  IGetProductAiMetadataResponse,
  IGetOnboardingProductsResponse,
  IPostAiSignalEventBody,
  IPostAiSignalEventResponse,
  IPostOnboardingResponse,
  IPostOnboardingDismissResponse,
  IGetTasteRecommendationsResponse,
  ITasteProfileResponse,
} from "./dto";

/** 온보딩 유명작 목록 */
export const useGetOnboardingProducts = () => {
  return useQuery<IGetOnboardingProductsResponse>({
    queryKey: ["onboardingProducts"],
    queryFn: async () => {
      const res = await instance.get("/v1/query/ai/onboarding-products");
      return res.data;
    },
  });
};

/** 작품 AI 메타데이터 */
export const useGetProductAiMetadata = (
  productId: number,
  enabled: boolean = true
) => {
  return useQuery<IGetProductAiMetadataResponse>({
    queryKey: ["productAiMetadata", productId],
    queryFn: async () => {
      const res = await instance.get(`/v1/query/ai/product-metadata/${productId}`);
      return res.data;
    },
    enabled: enabled && !!productId,
  });
};

/** 취향 기반 추천 섹션 (메인 페이지용) */
export const useGetTasteRecommendations = (
  adultYn: string,
  enabled: boolean = true
) => {
  return useQuery<IGetTasteRecommendationsResponse>({
    queryKey: ["tasteRecommendations", adultYn],
    queryFn: async () => {
      const res = await instance.get(
        `/v1/query/ai/taste-profile/recommendations?adult_yn=${adultYn}`
      );
      return res.data;
    },
    enabled,
  });
};

/** 내 취향 프로파일 (마이페이지용) */
export const useGetTasteProfile = () => {
  return useQuery<ITasteProfileResponse>({
    queryKey: ["tasteProfile"],
    queryFn: async () => {
      const res = await instance.get("/v1/query/ai/taste-profile");
      return res.data;
    },
  });
};

/** 온보딩 저장 */
export const usePostOnboarding = () => {
  return useMutation<
    IPostOnboardingResponse,
    unknown,
    {
      product_ids: number[];
      moods: string[];
      hero_tags?: string[];
      world_tone_tags?: string[];
      relation_tags?: string[];
    }
  >({
    mutationFn: async (body) => {
      const res = await instance.post(
        "/v1/command/ai/taste-profile/onboarding",
        body
      );
      return res.data;
    },
  });
};

/** 온보딩 모달 닫기(계정 기준 숨김) */
export const usePostOnboardingDismiss = () => {
  return useMutation<IPostOnboardingDismissResponse, unknown, void>({
    mutationFn: async () => {
      const res = await instance.post("/v1/command/ai/taste-profile/onboarding-dismiss");
      return res.data;
    },
  });
};

/** AI 신호 이벤트 적재 */
export const usePostAiSignalEvent = () => {
  return useMutation<IPostAiSignalEventResponse, unknown, IPostAiSignalEventBody>(
    {
      mutationFn: async (body) => {
        const res = await instance.post("/v1/command/ai/signal-events", body);
        return res.data;
      },
    }
  );
};

/** AI 챗 추천 */
export const usePostAiRecommend = () => {
  return useMutation<
    IAiRecommendResponse,
    unknown,
    {
      query?: string | null;
      preset?: string | null;
      exclude_product_ids?: number[];
      adult_yn?: "Y" | "N";
    }
  >({
    mutationFn: async (body) => {
      const res = await instance.post("/v1/command/ai/recommend", body);
      return res.data;
    },
  });
};

/** AI 챗 멀티턴 추천 (최소 구현) */
export const usePostAiChat = () => {
  return useMutation<IAiChatResponse, unknown, IAiChatRequest>({
    mutationFn: async (body) => {
      const res = await instance.post("/v1/command/ai/chat", body);
      return res.data;
    },
  });
};

/** AI 챗 히스토리 조회 */
export const useGetChatHistory = (enabled: boolean = false) => {
  return useQuery<IGetChatHistoryResponse>({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      const res = await instance.get("/v1/query/ai/chat/history");
      return res.data;
    },
    enabled,
    staleTime: Infinity,
  });
};

/** AI 챗 히스토리 삭제 */
export const useDeleteChatHistory = () => {
  return useMutation<{ data: { message: string } }, unknown, void>({
    mutationFn: async () => {
      const res = await instance.delete("/v1/command/ai/chat/history");
      return res.data;
    },
  });
};

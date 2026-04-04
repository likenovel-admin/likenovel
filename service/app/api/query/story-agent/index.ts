import { instance } from "../../axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ICreateStoryAgentSessionResponse,
  IGetStoryAgentMessagesResponse,
  IGetStoryAgentProductsResponse,
  IGetStoryAgentSessionsResponse,
  IPostStoryAgentMessageResponse,
} from "./dto";

export const useGetStoryAgentProducts = (keyword: string, adultYn: "Y" | "N") => {
  return useQuery<IGetStoryAgentProductsResponse>({
    queryKey: ["storyAgentProducts", keyword, adultYn],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/story-agent/products?keyword=${encodeURIComponent(keyword)}&adult_yn=${adultYn}`
      );
      return response.data;
    },
    enabled: keyword.trim().length > 0,
  });
};

export const useGetStoryAgentSessions = (
  productId: number | null,
  guestKey: string,
  adultYn: "Y" | "N"
) => {
  return useQuery<IGetStoryAgentSessionsResponse>({
    queryKey: ["storyAgentSessions", productId, guestKey, adultYn],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productId) {
        params.set("product_id", String(productId));
      }
      params.set("adult_yn", adultYn);
      const response = await instance.get(`/v1/query/story-agent/sessions?${params.toString()}`, {
        headers: guestKey ? { "X-Story-Agent-Guest-Key": guestKey } : undefined,
      });
      return response.data;
    },
    enabled: !!guestKey,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
};

export const useGetStoryAgentMessages = (sessionId: number | null, guestKey: string) => {
  return useQuery<IGetStoryAgentMessagesResponse>({
    queryKey: ["storyAgentMessages", sessionId, guestKey],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/story-agent/sessions/${sessionId}/messages`, {
        headers: guestKey ? { "X-Story-Agent-Guest-Key": guestKey } : undefined,
      });
      return response.data;
    },
    enabled: !!sessionId && !!guestKey,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
};

export const useCreateStoryAgentSession = () => {
  return useMutation<
    ICreateStoryAgentSessionResponse,
    unknown,
    {
      product_id: number;
      guest_key?: string | null;
      title?: string | null;
      adult_yn?: "Y" | "N";
      game_read_episode_to?: number | null;
    }
  >({
    mutationFn: async (body) => {
      const adultYn = body.adult_yn ?? "N";
      const response = await instance.post(`/v1/command/story-agent/sessions?adult_yn=${adultYn}`, body);
      return response.data;
    },
  });
};

export const usePostStoryAgentMessage = () => {
  return useMutation<
    IPostStoryAgentMessageResponse,
    unknown,
    {
      sessionId: number;
      content: string;
      client_message_id: string;
      guest_key?: string | null;
      game_read_episode_to?: number | null;
    }
  >({
    mutationFn: async ({ sessionId, ...body }) => {
      const response = await instance.post(
        `/v1/command/story-agent/sessions/${sessionId}/messages`,
        body,
        {
          skipAuthRedirectOn401: true,
        } as any
      );
      return response.data;
    },
  });
};

export const useDeleteStoryAgentSession = () => {
  return useMutation<
    { data: { sessionId: number; deletedYn: "Y" } },
    unknown,
    { sessionId: number; guest_key?: string | null }
  >({
    mutationFn: async ({ sessionId, ...body }) => {
      const response = await instance.delete(`/v1/command/story-agent/sessions/${sessionId}`, {
        data: body,
      });
      return response.data;
    },
  });
};

import { instance } from "../../axios";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
  ICreateWebsochatSessionResponse,
  IGetWebsochatBillingStatusResponse,
  IGetWebsochatMessagesResponse,
  IGetWebsochatProductsResponse,
  IGetWebsochatSessionsResponse,
  IPatchWebsochatSessionModeResponse,
  IPatchWebsochatSessionReadScopeResponse,
  IPostWebsochatMessageResponse,
} from "./dto";

export type WebsochatStreamRequestBody = {
  sessionId: number;
  content: string;
  client_message_id: string;
  guest_key?: string | null;
  starter_mode_key?: "qa" | "rp" | "ideal_worldcup" | null;
  qa_action_key?: "predict" | "next_episode_write" | null;
  rp_mode?: "free" | "scene" | null;
  active_character?: string | null;
  scene_episode_no?: number | null;
  game_mode?: "ideal_worldcup" | "vs_game" | null;
  game_read_episode_to?: number | null;
  account_read_episode_to?: number | null;
};

type WebsochatRequestOptions = {
  signal?: AbortSignal;
};

export type WebsochatStreamEvent =
  | { event: "assistant_started"; data: { sessionId: number; clientMessageId?: string | null } }
  | { event: "assistant_delta"; data: { delta: string } }
  | { event: "assistant_completed"; data: IPostWebsochatMessageResponse["data"] }
  | { event: "assistant_error"; data: { detail?: string | null } }
  | { event: "done"; data: Record<string, never> };

const getWebsochatAuthHeaders = () => {
  if (typeof window === "undefined") return {} as Record<string, string>;
  const accessToken =
    window.localStorage.getItem("access_token")
    || window.sessionStorage.getItem("access_token");
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const parseWebsochatSseEvents = (
  chunk: string,
  onEvent: (event: WebsochatStreamEvent) => void
) => {
  const rawEvents = chunk.split("\n\n");
  const remains = rawEvents.pop() ?? "";
  rawEvents.forEach((rawEvent) => {
    const lines = rawEvent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return;
    let eventName = "message";
    const dataLines: string[] = [];
    lines.forEach((line) => {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
        return;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    });
    if (!dataLines.length) return;
    try {
      const parsed = JSON.parse(dataLines.join("\n"));
      onEvent({ event: eventName as WebsochatStreamEvent["event"], data: parsed } as WebsochatStreamEvent);
    } catch {
      // ignore malformed frames
    }
  });
  return remains;
};

export const postWebsochatMessageStream = async (
  body: WebsochatStreamRequestBody,
  onEvent: (event: WebsochatStreamEvent) => void,
  options?: WebsochatRequestOptions
) => {
  const { sessionId, guest_key, ...payload } = body;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...getWebsochatAuthHeaders(),
  };
  if (guest_key) {
    headers["X-Websochat-Guest-Key"] = guest_key;
  }
  const response = await fetch(`/api/v1/command/websochat/sessions/${sessionId}/messages/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...payload, guest_key }),
    credentials: "include",
    signal: options?.signal,
  });
  if (!response.ok || !response.body) {
    const fallbackText = await response.text().catch(() => "");
    throw new Error(fallbackText || "websochat stream failed");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawTerminalEvent = false;
  const handleEvent = (event: WebsochatStreamEvent) => {
    onEvent(event);
    if (
      event.event === "assistant_completed"
      || event.event === "assistant_error"
      || event.event === "done"
    ) {
      sawTerminalEvent = true;
    }
  };
  while (true) {
    if (sawTerminalEvent) {
      try {
        await reader.cancel();
      } catch {
        // ignore reader cancellation failures
      }
      break;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseWebsochatSseEvents(buffer, handleEvent);
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    parseWebsochatSseEvents(`${buffer}\n\n`, handleEvent);
  }
};

export const postWebsochatMessageOnce = async (
  body: WebsochatStreamRequestBody,
  options?: WebsochatRequestOptions
) => {
  const { sessionId, ...payload } = body;
  const response = await instance.post(
    `/v1/command/websochat/sessions/${sessionId}/messages`,
    payload,
    {
      skipAuthRedirectOn401: true,
      signal: options?.signal,
    } as any
  );
  return response.data as IPostWebsochatMessageResponse;
};

export const postWebsochatNextEpisodeMessageOnce = async (
  body: WebsochatStreamRequestBody,
  options?: WebsochatRequestOptions
) => {
  const { sessionId, guest_key, ...payload } = body;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getWebsochatAuthHeaders(),
  };
  if (guest_key) {
    headers["X-Websochat-Guest-Key"] = guest_key;
  }

  const response = await fetch(`/websochat-api/sessions/${sessionId}/next-episode`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...payload, guest_key }),
    credentials: "include",
    signal: options?.signal,
  });

  const responseText = await response.text();
  let parsed: IPostWebsochatMessageResponse | null = null;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed) {
    const error = new Error(
      (parsed as any)?.message || responseText || "websochat next-episode failed"
    ) as Error & { response?: { status: number; data?: any } };
    error.response = {
      status: response.status,
      data: parsed || { message: responseText || "websochat next-episode failed" },
    };
    throw error;
  }

  return parsed;
};

export const getWebsochatBillingStatusQueryOptions = (
  actorKey: string,
  guestKey?: string | null,
  qaActionKey?: "predict" | "next_episode_write" | null
) =>
  queryOptions<IGetWebsochatBillingStatusResponse>({
    queryKey: ["websochatBillingStatus", actorKey, qaActionKey || "default"],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (qaActionKey) {
        query.set("qa_action_key", qaActionKey);
      }
      const response = await instance.get(`/v1/query/websochat/billing-status${query.toString() ? `?${query.toString()}` : ""}`, {
        headers: guestKey ? { "X-Websochat-Guest-Key": guestKey } : undefined,
        skipAuthRedirectOn401: true,
      } as any);
      return response.data;
    },
    enabled: !!actorKey,
    retry: false,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

export const useGetWebsochatBillingStatus = (
  actorKey: string,
  guestKey?: string | null,
  qaActionKey?: "predict" | "next_episode_write" | null
) => {
  return useQuery(getWebsochatBillingStatusQueryOptions(actorKey, guestKey, qaActionKey));
};

export const useGetWebsochatProducts = (keyword: string, adultYn: "Y" | "N") => {
  return useQuery<IGetWebsochatProductsResponse>({
    queryKey: ["websochatProducts", keyword, adultYn],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/websochat/products?keyword=${encodeURIComponent(keyword)}&adult_yn=${adultYn}`
      );
      return response.data;
    },
    enabled: keyword.trim().length > 0,
  });
};

export const useGetWebsochatSessions = (
  productId: number | null,
  actorKey: string,
  guestKey: string | null,
  adultYn: "Y" | "N"
) => {
  return useQuery<IGetWebsochatSessionsResponse>({
    queryKey: ["websochatSessions", productId, actorKey, adultYn],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productId) {
        params.set("product_id", String(productId));
      }
      params.set("adult_yn", adultYn);
      const response = await instance.get(`/v1/query/websochat/sessions?${params.toString()}`, {
        headers: guestKey ? { "X-Websochat-Guest-Key": guestKey } : undefined,
      });
      return response.data;
    },
    enabled: !!actorKey,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
};

export const useGetWebsochatMessages = (
  sessionId: number | null,
  actorKey: string,
  guestKey: string | null
) => {
  return useQuery(getWebsochatMessagesQueryOptions(sessionId, actorKey, guestKey));
};

export const getWebsochatMessagesQueryOptions = (
  sessionId: number | null,
  actorKey: string,
  guestKey: string | null
) =>
  queryOptions<IGetWebsochatMessagesResponse>({
    queryKey: ["websochatMessages", sessionId, actorKey],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/websochat/sessions/${sessionId}/messages`, {
        headers: guestKey ? { "X-Websochat-Guest-Key": guestKey } : undefined,
      });
      return response.data;
    },
    enabled: !!sessionId && !!actorKey,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useCreateWebsochatSession = () => {
  return useMutation<
    ICreateWebsochatSessionResponse,
    unknown,
    {
      product_id: number;
      guest_key?: string | null;
      title?: string | null;
      adult_yn?: "Y" | "N";
      game_read_episode_to?: number | null;
      account_read_episode_to?: number | null;
    }
  >({
    mutationFn: async (body) => {
      const adultYn = body.adult_yn ?? "N";
      const response = await instance.post(`/v1/command/websochat/sessions?adult_yn=${adultYn}`, body);
      return response.data;
    },
  });
};

export const usePostWebsochatMessage = () => {
  return useMutation<
    IPostWebsochatMessageResponse,
    unknown,
    WebsochatStreamRequestBody
  >({
    mutationFn: async (body) => postWebsochatMessageOnce(body),
  });
};

export const usePostWebsochatNextEpisodeMessage = () => {
  return useMutation<
    IPostWebsochatMessageResponse,
    unknown,
    WebsochatStreamRequestBody
  >({
    mutationFn: async (body) => postWebsochatNextEpisodeMessageOnce(body),
  });
};

export const usePatchWebsochatSessionReadScope = () => {
  return useMutation<
    IPatchWebsochatSessionReadScopeResponse,
    unknown,
    {
      sessionId: number;
      guest_key?: string | null;
      read_episode_to: number;
    }
  >({
    mutationFn: async ({ sessionId, ...body }) => {
      const response = await instance.patch(
        `/v1/command/websochat/sessions/${sessionId}/read-scope`,
        body
      );
      return response.data;
    },
  });
};

export const usePatchWebsochatSessionMode = () => {
  return useMutation<
    IPatchWebsochatSessionModeResponse,
    unknown,
    {
      sessionId: number;
      guest_key?: string | null;
      mode_key: "qa" | "rp" | "ideal_worldcup";
      rp_mode?: "free" | "scene" | null;
      force_entry_guide?: boolean;
    }
  >({
    mutationFn: async ({ sessionId, ...body }) => {
      const response = await instance.patch(
        `/v1/command/websochat/sessions/${sessionId}/mode`,
        body
      );
      return response.data;
    },
  });
};

export const useDeleteWebsochatSession = () => {
  return useMutation<
    { data: { sessionId: number; deletedYn: "Y" } },
    unknown,
    { sessionId: number; guest_key?: string | null }
  >({
    mutationFn: async ({ sessionId, ...body }) => {
      const response = await instance.delete(`/v1/command/websochat/sessions/${sessionId}`, {
        data: body,
      });
      return response.data;
    },
  });
};

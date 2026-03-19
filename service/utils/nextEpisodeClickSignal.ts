import type { IPostAiSignalEventBody } from "@/app/api/query/recommendation/dto";

export interface NextEpisodeClickSignalContext {
  originAction: "next_episode_click";
  productId: number;
  fromEpisodeId: number;
  redirectToEpisodeId: number;
}

export const postNextEpisodeClickSignalBestEffort = (
  context: NextEpisodeClickSignalContext | null | undefined
) => {
  if (!context) return;

  const accessToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (!accessToken) return;

  const body: IPostAiSignalEventBody = {
    product_id: context.productId,
    episode_id: context.fromEpisodeId,
    event_type: "next_episode_click",
    next_available_yn: "Y",
    event_payload: {
      redirect_to_episode_id: context.redirectToEpisodeId,
    },
  };

  void fetch("/api/v1/command/ai/signal-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    keepalive: true,
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        console.error("[aiSignal] next_episode_click failed", {
          status: response.status,
          fromEpisodeId: context.fromEpisodeId,
          redirectToEpisodeId: context.redirectToEpisodeId,
        });
      }
    })
    .catch((error) => {
      console.error("[aiSignal] next_episode_click request error", error);
    });
};

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import {
  ISelectMyEvaluationResponse,
  ISelectViewerPathResponse,
  IUseSelectEpisodesResponse,
} from "./dto";
import { ISelectEpisodeResponse } from "../author/episode/dto";

export const useSelectEpisodes = (
  productId: number,
  userId: number | null,
  page: number,
  limit: number,
  orderBy: "episodeNo" | "date",
  orderDir: "asc" | "desc"
) => {
  return useInfiniteQuery<IUseSelectEpisodesResponse, unknown>({
    queryKey: [
      "selectEpisode",
      productId,
      userId,
      page,
      limit,
      orderBy,
      orderDir,
    ],
    queryFn: async ({ queryKey, pageParam }) => {
      const [_, productId, userId, page, limit, orderBy, orderDir] = queryKey;
      const response = await instance.get(
        `/v1/query/products/${productId}/episodes?${
          userId ? "user_id=" + userId + "&" : ""
        }page=${pageParam}&limit=${limit}&order_by=${orderBy}&order_dir=${orderDir}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return lastPage.data.episodes.length === 0 ? undefined : nextPage;
    },
    initialPageParam: 1,
  });
};

export const useSelectViewerPath = (episodeId: number) => {
  return useQuery<ISelectViewerPathResponse>({
    queryKey: ["selectViewerPath", episodeId],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/episodes/${episodeId}`);
      return response.data;
    },
    enabled: !!episodeId,
    throwOnError: false,
    retry: 1,
    staleTime: 1000 * 60 * 8,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// Next episode info (doesn't mark as read — /info endpoint)
export const useSelectNextEpisodeInfo = (episodeId: number) => {
  return useQuery<ISelectEpisodeResponse>({
    queryKey: ["selectNextEpisodeInfo", episodeId],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/episodes/${episodeId}/info`);
      return response.data;
    },
    enabled: !!episodeId,
    throwOnError: false,
  });
};

export const useSelectEpisodeEvaluation = (
  productId: number,
  episodeId: number,
  enabled?: boolean
) => {
  return useQuery<ISelectMyEvaluationResponse>({
    queryKey: ["useMyEvaluation", productId, episodeId],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/${productId}/evaluation?episode_id=${episodeId}`
      );
      return response.data;
    },
    enabled: !!enabled,
  });
};

export const useLikeEpisode = () => {
  return useMutation({
    mutationFn: async (episodeId: number) => {
      return await instance.post(`/v1/command/episodes/${episodeId}/like`);
    },
  });
};

export const useUnLikeEpisode = () => {
  return useMutation({
    mutationFn: async (episodeId: number) => {
      return await instance.post(`/v1/command/episodes/${episodeId}/unlike`);
    },
  });
};

export const useEvaluateEpisode = () => {
  return useMutation({
    mutationFn: async (data: {
      episodeId: number;
      body: {
        rating: String;
      };
    }) => {
      return await instance.post(
        `/v1/command/episodes/${data.episodeId}/evaluation`,
        data.body
      );
    },
  });
};

export const useAddCommentEpisode = () => {
  return useMutation({
    mutationFn: async (data: {
      episodeId: number;
      body: {
        content: String;
      };
    }) => {
      return await instance.post(
        `/v1/command/products/comments/episodes/${data.episodeId}`,
        data.body
      );
    },
  });
};

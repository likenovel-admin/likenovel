"use client";
import {
  IGetSaleByEpisodeDetailResponse,
  IGetSaleByEpisodeParams,
  IGetSaleByEpisodesResponse,
} from "@/api/sales-by-episode/dto";
import apiClient from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetSaleByEpisodes = (params: IGetSaleByEpisodeParams) => {
  return useQuery<IGetSaleByEpisodesResponse>({
    queryKey: ["GetSaleByEpisodeParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetSaleByEpisodesResponse>({
        url: "/v1/query/partners/sales-by-episode",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadSaleByEpisodes = async (
  params: IGetSaleByEpisodeParams
) => {
  const res = await apiClient.request<IGetSaleByEpisodesResponse>({
    url: "/v1/query/partners/sales-by-episode/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetSaleByEpisodeDetail = (
  id: string,
  params: IGetSaleByEpisodeParams
) => {
  return useQuery<IGetSaleByEpisodeDetailResponse>({
    queryKey: ["GetSaleByEpisodeDetail", JSON.stringify(id)],

    queryFn: async () => {
      const res = await apiClient.request<IGetSaleByEpisodeDetailResponse>({
        url: "/v1/query/partners/sales-by-episode/" + id,
        method: "GET",
        queryParams: params,
      });
      return res;
    },
    enabled: !!id,
  });
};

export const getDownloadSaleByEpisodeDetail = async (
  params: IGetSaleByEpisodeParams & { id: string }
) => {
  const res = await apiClient.request<IGetSaleByEpisodesResponse>({
    url: `/v1/query/partners/sales-by-episode/${params.id}/all`,
    method: "GET",
    queryParams: params,
  });
  return res;
};

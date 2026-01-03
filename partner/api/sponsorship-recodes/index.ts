"use client";

import {
  IGetSponsorshipRecodeParams,
  IGetSponsorshipRecodesResponse,
  ISponsorshipSettlementResponse,
} from "@/api/sponsorship-recodes/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetSponsorshipRecodes = (
  params: IGetSponsorshipRecodeParams
) => {
  return useQuery<IGetSponsorshipRecodesResponse>({
    queryKey: ["GetSponsorshipRecodeParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetSponsorshipRecodesResponse>({
        url: "/v1/query/partners/sponsorship-recodes",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadSponsorshipRecodes = async (
  params: IGetSponsorshipRecodeParams
) => {
  const res = await apiClient.request<IGetSponsorshipRecodesResponse>({
    url: "/v1/query/partners/sponsorship-recodes/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useSponsorshipSettlement = () => {
  return useMutation<ISponsorshipSettlementResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<ISponsorshipSettlementResponse>({
        url: `/v1/command/partners/sponsorship-recodes/${id}/settlement`,
        method: "POST",
      });
    },
  });
};

"use client";
import {
  IGetDailyTicketParams,
  IGetDailyTicketsResponse,
} from "@/api/daily-ticket/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetDailyTickets = (params: IGetDailyTicketParams) => {
  return useQuery<IGetDailyTicketsResponse>({
    queryKey: ["GetDailyTicketParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetDailyTicketsResponse>({
        url: "/v1/query/partners/daily-ticket",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadDailyTickets = async (
  params: IGetDailyTicketParams
) => {
  const res = await apiClient.request<IGetDailyTicketsResponse>({
    url: "/v1/query/partners/daily-ticket/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

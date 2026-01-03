"use client";
import {
  IGetAlgorithmParams,
  IGetAlgorithmSectionsResponse,
  IGetAlgorithmSetTopicResponse,
  IGetAlgorithmSimilarResponse,
  IGetAlgorithmUserResponse,
  IUpdateAlgorithmSectionRequest,
  IUpdateAlgorithmSectionResponse,
} from "@/api/algorithm/dto";
import {
  IAddEventRequest,
  IAddEventResponse,
  IGetEventDetailResponse,
  IGetEventParams,
  IGetEventsResponse,
} from "@/api/event/dto";
import apiClient from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetEvents = (params: IGetEventParams) => {
  return useQuery<IGetEventsResponse>({
    queryKey: ["GetEventParams", JSON.stringify(params)],

    queryFn: async () => {
      const res = await apiClient.request<IGetEventsResponse>({
        url: "/v1/query/admins/events",
        method: "GET",
        queryParams: params,
      });
      return res;
    },
  });
};

export const getDownloadEvents = async (params: IGetEventParams) => {
  const res = await apiClient.request<IGetEventsResponse>({
    url: "/v1/query/admins/events/all",
    method: "GET",
    queryParams: params,
  });
  return res;
};

export const useGetEventDetail = (id: string, enabled: boolean) => {
  return useQuery<IGetEventDetailResponse>({
    queryKey: ["GetEventDetail", JSON.stringify(id)],

    queryFn: async () => {
      const res = await apiClient.request<IGetEventDetailResponse>({
        url: "/v1/query/admins/events/" + id,
        method: "GET",
      });
      return res;
    },
    enabled,
  });
};

export const getDownloadEventByRecipients = async (id: string) => {
  const res = await apiClient.request<string>({
    url: `/v1/query/admins/events/${id}/recipients`,
    method: "GET",
    responseType: "blob",
  });
  return res;
};

export const useAddEvent = () => {
  return useMutation<IAddEventResponse, Error, IAddEventRequest>({
    mutationFn: async (body: IAddEventRequest) => {
      return await apiClient.request<IAddEventResponse>({
        url: `/v1/command/admins/events`,
        method: "POST",
        body: body,
      });
    },
  });
};

export const useUpdateEvent = () => {
  return useMutation<
    IAddEventResponse,
    Error,
    {
      id: string;
      body: IAddEventRequest;
    }
  >({
    mutationFn: async (data: { id: string; body: IAddEventRequest }) => {
      return await apiClient.request<IAddEventResponse>({
        url: `/v1/command/admins/events/${data.id}`,
        method: "PUT",
        body: data.body,
      });
    },
  });
};

export const useDeleteEvent = () => {
  return useMutation<IAddEventResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IAddEventResponse>({
        url: `/v1/command/admins/events/${id}`,
        method: "DELETE",
      });
    },
  });
};

export const useShowEvent = () => {
  return useMutation<IAddEventResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IAddEventResponse>({
        url: `/v1/command/admins/events/${id}/show`,
        method: "POST",
      });
    },
  });
};

export const useHideEvent = () => {
  return useMutation<IAddEventResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.request<IAddEventResponse>({
        url: `/v1/command/admins/events/${id}/hide`,
        method: "POST",
      });
    },
  });
};

import { instance } from "@/app/api/axios";
import {
  SelectEventDetailResponse,
  SelectEventsResponse,
} from "@/app/api/query/event/dto";
import { useQuery } from "@tanstack/react-query";

export const useSelectEvents = (close_yn: "Y" | "N", disable?: boolean) => {
  return useQuery<SelectEventsResponse>({
    queryKey: ["selectEvents"],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/events?close_yn=${close_yn}`
      );
      return response.data;
    },
    enabled: !disable,
  });
};

export const useSelectEventDetail = (id: string | number, round?: 0 | 1) => {
  return useQuery<SelectEventDetailResponse>({
    queryKey: ["selectEventDetail", id],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/events/${id}?round_no=${round}`
      );
      return response.data;
    },
  });
};

import { instance } from "@/app/api/axios";
import {
  SelectUserGiftBookHistoryResponse,
  SelectUserGiftBookResponse,
} from "@/app/api/query/giftbook/dto";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useSelectUserGiftBook = () => {
  return useQuery<SelectUserGiftBookResponse>({
    queryKey: ["selectUserGiftBook"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/user-giftbook`);
      return response.data;
    },
  });
};

export const useSelectUserGiftBookHistory = (type: "received" | "used") => {
  return useQuery<SelectUserGiftBookHistoryResponse>({
    queryKey: ["selectUserGiftBookHistory", type],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/user-giftbook/history/${type}`
      );
      return response.data;
    },
  });
};

export const useReceiveGiftBox = () => {
  return useMutation({
    mutationFn: async (gift_id: number) => {
      return await instance.post(
        `/v1/command/user-giftbook/${gift_id}/receive`
      );
    },
  });
};

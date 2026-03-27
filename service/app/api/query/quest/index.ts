import { IUseSelectQuestResponse } from "@/app/api/query/quest/dto";
import { useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";

export const useSelectQuest = (
  enabled: boolean = true,
  isAuthenticated?: boolean
) => {
  return useQuery<IUseSelectQuestResponse, unknown>({
    queryKey: ["selectQuest", isAuthenticated ? "auth" : "guest"],
    enabled,
    queryFn: async () => {
      const response = await instance.get(`/v1/query/quests`);

      return response.data;
    },
  });
};

export const useReceiveQuestRewards = () => {
  return useMutation({
    mutationFn: async ({
      quest_id,
      reward_id,
    }: {
      quest_id: number;
      reward_id: number;
    }) => {
      return await instance.put(
        `/v1/command/quests/${quest_id}/reward?reward_id=${reward_id}`
      );
    },
  });
};

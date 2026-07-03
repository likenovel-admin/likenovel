import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectPanelsResponse } from "./dto";

interface Props {
  division: string;
  enabled?: boolean;
}

export const useSelectPanels = ({ division, enabled = true }: Props) => {
  return useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectPanels", division],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/banners/${division}`);
      return response.data;
    },
    enabled: enabled && Boolean(division),
  });
};

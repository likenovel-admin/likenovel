import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectPanelsResponse } from "./dto";

interface Props {
  division: string;
}

export const useSelectPanels = ({ division }: Props) => {
  return useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectPanels", division],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/banners/${division}`);
      return response.data;
    },
  });
};

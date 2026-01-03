import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { ISelectPopupsResponse } from "./dto";

/**
 * Fetch active popups from CMS
 * Returns only popups with displayStatus = "shown"
 */
export const useSelectPopups = () => {
  return useQuery<ISelectPopupsResponse, unknown>({
    queryKey: ["selectPopups"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/popup");
      return response.data;
    },
  });
};

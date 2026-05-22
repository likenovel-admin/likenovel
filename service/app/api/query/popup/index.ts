import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { ISelectPopupsResponse } from "./dto";
import { ADMIN_POPUP_QUERY_PATH } from "@/constants/adminPopup";

/**
 * Fetch active popups from CMS
 * Returns only popups with displayStatus = "shown"
 */
export const useSelectPopups = () => {
  return useQuery<ISelectPopupsResponse, unknown>({
    queryKey: ["selectPopups"],
    queryFn: async () => {
      const response = await instance.get(ADMIN_POPUP_QUERY_PATH);
      return response.data;
    },
  });
};

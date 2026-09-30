import {
  SelectNoticesResponse,
  SelectRollingNoticeResponse,
} from "@/app/api/query/notice/dto";
import {
  TOP_NOTICE_BAR_REFRESH_MS,
  type ITopNoticeBar,
} from "@/utils/topNoticeBar";
import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";

export const useGetNoticeTopBar = (enabled: boolean = true) => {
  return useQuery<{ data: ITopNoticeBar | null }>({
    queryKey: ["noticeTopBar"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/notices/top-bar`);
      return response.data;
    },
    enabled,
    staleTime: TOP_NOTICE_BAR_REFRESH_MS,
    refetchInterval: TOP_NOTICE_BAR_REFRESH_MS,
    retry: false,
    // 선택 기능이라 실패해도 전역 오류 화면으로 보내지 않고 띠만 숨긴다.
    throwOnError: false,
  });
};

export const useSelectRollingNotice = () => {
  return useQuery<SelectRollingNoticeResponse>({
    queryKey: ["selectRollingNotice"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/notices/rolling-notices`);
      return response.data;
    },
  });
};

export const useSelectNotices = (
  page: number = 1,
  countPerPage: number = 10
) => {
  return useQuery<SelectNoticesResponse>({
    queryKey: ["selectNotices", page, countPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: countPerPage.toString(),
      });
      const response = await instance.get(
        `/v1/query/notices?${params.toString()}`
      );
      return response.data;
    },
  });
};

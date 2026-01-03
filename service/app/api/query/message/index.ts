import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import {
  FilterType,
  IGetChatUnReadCountResponse,
  ISelectChatRoomDetailResponse,
  ISelectMessageChatRoomsResponse,
} from "./dto";

export const useMessageList = () => {
  return useSuspenseQuery<any[]>({
    queryKey: ["messages"],
    queryFn() {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: "1",
                name: "달콤냥 작가님",
                content: "네 감사합니다!",
                createdAt: "2024-03-05",
                unreadCount: 0,
              },
              {
                id: "2",
                name: "제로콜라 작가님",
                content: "이번에 올린 회차 어떠셨어요?",
                createdAt: "2024-03-04",
                unreadCount: 1,
              },
              {
                id: "3",
                name: "이영희 CP",
                content: `안녕하세요. 카카오페이지에서 정식 연재 제안이 와서 연락드립니다.`,
                createdAt: "2024-03-03",
                unreadCount: 3,
              },
            ]),
          1000
        )
      );
    },
  });
};

export const useUserInfo = (selectedMessageId: string) => {
  return useSuspenseQuery<any>({
    queryKey: ["userInfo", selectedMessageId],
    queryFn() {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              id: "1",
              name: "달콤냥 작가님",
              createdAt: "2024-03-05",
              company: "라이트노벨",
            }),
          500
        )
      );
    },
  });
};

export const useMessageDetail = (messageId: string) => {
  return useSuspenseQuery<any[]>({
    queryKey: ["messageDetail", messageId],
    queryFn() {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: "1",
                name: "홍길동",
                content:
                  "이번 회차는 하루 쉬어 가겠습니다~ 공지 업로드 해둘게요.",
                createdAt: "2024-03-05T10:00:00",
                type: "received",
                read: true,
              },
              {
                id: "2",
                name: "김철수",
                content: `넵 알겠습니다. 그럼 다음 회차는 언제 업로드 하시나요?`,
                createdAt: "2024-03-05T11:30:00",
                type: "sent",
                read: true,
              },
              {
                id: "3",
                name: "이영희",
                content: "다음주 수요일 정식 연재날에 업로드 하겠습니다!",
                createdAt: "2024-03-05T09:15:00",
                type: "received",
                read: true,
              },
              {
                id: "4",
                name: "박민수",
                content: "알겠습니다. 공지 기다리고 있겠습니다. 쉬세요~",
                createdAt: "2024-03-05T14:45:00",
                type: "sent",
                read: true,
              },
              {
                id: "5",
                name: "최지우",
                content: "네 감사합니다!",
                createdAt: "2024-03-05T16:00:00",
                type: "received",
                read: true,
              },
              {
                id: "6",
                name: "정수현",
                content: "저번에 업로드 해주신 회차 독자 반응이 아주 좋네요.",
                createdAt: "2024-02-28T08:30:00",
                type: "sent",
                read: true,
              },
              {
                id: "7",
                name: "한지민",
                content: "넵 좋은 하루 되세요!",
                createdAt: "2024-02-27T12:00:00",
                type: "received",
                read: true,
              },
              {
                id: "8",
                name: "김민준",
                content: "좋은 하루 되세요",
                createdAt: "2024-02-26T13:30:00",
                type: "sent",
                read: false,
              },
              {
                id: "9",
                name: "박지성",
                content: "감사합니다",
                createdAt: "2024-02-25T15:45:00",
                type: "received",
                read: true,
              },
              {
                id: "10",
                name: "이수민",
                content: "잘 부탁드립니다",
                createdAt: "2024-02-24T17:00:00",
                type: "sent",
                read: false,
              },
              {
                id: "11",
                name: "김하늘",
                content: "좋은 아침입니다",
                createdAt: "2024-02-23T08:00:00",
                type: "received",
                read: true,
              },
              {
                id: "12",
                name: "이준호",
                content: "안녕하세요",
                createdAt: "2024-02-22T09:30:00",
                type: "sent",
                read: false,
              },
              {
                id: "13",
                name: "박보영",
                content: "반갑습니다",
                createdAt: "2024-02-21T10:45:00",
                type: "received",
                read: true,
              },
              {
                id: "14",
                name: "김유정",
                content: "잘 지내세요",
                createdAt: "2024-02-20T11:15:00",
                type: "sent",
                read: false,
              },
              {
                id: "15",
                name: "이동욱",
                content: "안녕히 가세요",
                createdAt: "2024-02-19T12:30:00",
                type: "received",
                read: true,
              },
              {
                id: "16",
                name: "정해인",
                content: "오랜만이에요",
                createdAt: "2024-02-18T13:45:00",
                type: "sent",
                read: false,
              },
              {
                id: "17",
                name: "김지원",
                content: "잘 지내고 있나요?",
                createdAt: "2024-02-17T14:00:00",
                type: "received",
                read: true,
              },
              {
                id: "18",
                name: "박서준",
                content: "다음에 봐요",
                createdAt: "2024-02-16T15:30:00",
                type: "sent",
                read: false,
              },
              {
                id: "19",
                name: "한예슬",
                content: "좋은 하루 되세요",
                createdAt: "2024-02-15T16:45:00",
                type: "received",
                read: true,
              },
              {
                id: "20",
                name: "이동건",
                content: "감사합니다",
                createdAt: "2024-02-14T17:00:00",
                type: "sent",
                read: false,
              },
            ]),
          1000
        )
      );
    },
  });
};

export const useSelectMessageChatRooms = (
  filter_type: FilterType = "all",
  search_nickname?: string,
  page: number = 1,
  count_per_page: number = 20
) => {
  return useQuery<ISelectMessageChatRoomsResponse, unknown>({
    queryKey: [
      "selectMessageChatRooms",
      filter_type,
      search_nickname,
      page,
      count_per_page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        filter_type,
        page: page.toString(),
        count_per_page: count_per_page.toString(),
      });

      if (search_nickname) {
        params.append("search_nickname", search_nickname);
      }

      const response = await instance.get<ISelectMessageChatRoomsResponse>(
        `/v1/query/messages/chat-rooms?${params.toString()}`
      );

      return response.data;
    },
  });
};

export const useSelectChatRoomDetails = (
  room_id: string,
  page: number = 1,
  count_per_page: number = 20
) => {
  return useQuery<ISelectChatRoomDetailResponse, unknown>({
    queryKey: ["selectChatRoomDetail", room_id, page, count_per_page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        count_per_page: count_per_page.toString(),
      });

      const response = await instance.get<ISelectChatRoomDetailResponse>(
        `/v1/query/messages/chat-rooms/${room_id}/messages?${params.toString()}`
      );

      return response.data;
    },
  });
};

export const useGetChatUnReadCount = (enabled?: boolean) => {
  return useQuery<IGetChatUnReadCountResponse, unknown>({
    queryKey: ["getChatUnReadCount"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/messages/unread-count`);
      return response.data;
    },
    enabled,
  });
};

export const useReportChat = () => {
  return useMutation({
    mutationFn: async ({
      room_id,
      body,
    }: {
      room_id: string;
      body: { report_reason: string; report_detail: string };
    }) => {
      return await instance.post(
        `/v1/command/messages/chat-rooms/${room_id}/report`,
        body
      );
    },
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: async ({
      room_id,
      body,
    }: {
      room_id: string;
      body: { content: string };
    }) => {
      return await instance.post(
        `/v1/command/messages/chat-rooms/${room_id}/messages`,
        body
      );
    },
  });
};

export const useCreateChat = () => {
  return useMutation({
    mutationFn: async ({
      target_user_id,
      default_message,
    }: {
      target_user_id: number;
      default_message?: string;
    }) => {
      return await instance.post(`/v1/command/messages/chat-rooms`, {
        target_user_id,
        default_message,
      });
    },
  });
};

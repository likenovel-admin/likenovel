import { IChatRoom, IMessage } from "@/types";

export interface ISelectMessageChatRoomsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IChatRoom[];
}

export type FilterType = "all" | "unread";

export interface ISelectChatRoomDetailResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMessage[];
}

export interface IGetChatUnReadCountResponse {
  unreadCount: number;
}

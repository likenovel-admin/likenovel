import { useSelectChatRoomDetails } from "@/app/api/query/message";
import { useMessage } from "@/contexts/MessageContext";
import { getUser } from "@/utils/getUser";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Spinner from "../common/Spinner";
import UserProfilePicture from "./UserProfilePicture";

const MessageChatList = ({ scrollRef }: { scrollRef: HTMLDivElement }) => {
  const { selectedMessageId, selectedChatRoom } = useMessage();
  const user = getUser();
  const currentUserId = user?.userId;
  const queryClient = useQueryClient();
  const { data } = useSelectChatRoomDetails(selectedMessageId!, 1, 20);
  const previousMessageCountRef = useRef(0);

  const groupedMessages = useMemo(() => {
    if (!data?.results || !selectedChatRoom) return [];

    // Sort messages by created_date ascending (oldest first)
    const sortedMessages = [...data.results].sort(
      (a, b) =>
        new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
    );

    const grouped = sortedMessages.reduce((acc, cur) => {
      const date = dayjs(new Date(cur.created_date)).format("YYYY.MM.DD");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(cur);
      return acc;
    }, {} as Record<string, typeof data.results>);

    return Object.entries(grouped).map(([date, messages]) => ({
      date,
      messageList: messages,
    }));
  }, [data?.results, selectedChatRoom]);

  useEffect(() => {
    if (scrollRef && data?.results) {
      const currentMessageCount = data.results.length;

      // Scroll to bottom when messages change (new message or initial load)
      if (currentMessageCount !== previousMessageCountRef.current) {
        setTimeout(() => {
          scrollRef.scrollTop = scrollRef.scrollHeight;
        }, 0);
        previousMessageCountRef.current = currentMessageCount;
      }
    }
  }, [data?.results, scrollRef]);

  // Refetch unread count when chat room details are loaded
  useEffect(() => {
    if (data?.results && selectedMessageId) {
      queryClient.invalidateQueries({ queryKey: ["getChatUnReadCount"] });
      queryClient.invalidateQueries({ queryKey: ["selectMessageChatRooms"] });
    }
  }, [data?.results, selectedMessageId, queryClient]);

  return groupedMessages.map((group) => (
    <div key={group.date} className="flex flex-col">
      <div className="font-semibold text-14pxr mb-4 text-dark-gray-300 text-center">
        {group.date}
      </div>
      <div className="flex flex-col gap-7">
        {group.messageList.map((message) => {
          // Message is "sent" if the sender is the current user, otherwise "received"
          const isSent = message.sender_user_id === currentUserId;
          return (
            <ChatItem
              key={message.message_id}
              content={message.content}
              createdAt={message.created_date}
              read={message.is_read === "Y"}
              type={isSent ? "sent" : "received"}
              picture={
                !isSent
                  ? selectedChatRoom?.other_user_profile_image_path || ""
                  : ""
              }
            />
          );
        })}
      </div>
    </div>
  ));
};

const ChatItem = ({
  content,
  picture,
  createdAt,
  type,
  read,
}: {
  content: string;
  picture: string;
  createdAt: string;
  type: "sent" | "received";
  read: boolean;
}) => {
  const directionClassName =
    type === "sent" ? "flex-row-reverse" : "justify-start";
  const time = dayjs(new Date(createdAt)).format("HH:mm");
  console.log("time", time);
  return (
    <div className={`flex gap-2 ${directionClassName}`}>
      {type === "received" && <UserProfilePicture picture={picture} />}
      <ChatBubble type={type}>{content}</ChatBubble>
      <div className="text-11pxr text-dark-gray-300 mt-auto">
        <span>{!read ? "안 읽음" : ""}</span>
        <br />
        <span>{time}</span>
      </div>
    </div>
  );
};

const ChatBubble = ({ children, type }: { children: string; type: string }) => {
  const sentClassName = "bg-primary-100 text-white  rounded-tl-xl";
  const receivedClassName = "bg-white text-black-100 rounded-tr-xl";
  const className = type === "sent" ? sentClassName : receivedClassName;
  return (
    <div
      className={`px-[14px] py-3 rounded-b-xl whitespace-pre-wrap max-w-[80%] ${className}`}
    >
      {children}
    </div>
  );
};

const MessageChatListContainer = () => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  return (
    <div
      className="border-t rounded-0 flex flex-col flex-1 relative overflow-y-scroll"
      ref={setRef}
    >
      <div className="py-3 px-5 flex flex-1 flex-col gap-6">
        <Suspense
          fallback={
            <div className="m-auto">
              <Spinner />
            </div>
          }
        >
          {ref && <MessageChatList scrollRef={ref} />}
        </Suspense>
      </div>
    </div>
  );
};

export default MessageChatListContainer;

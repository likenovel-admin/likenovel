"use client";

import { useSelectMessageChatRooms } from "@/app/api/query/message";
import { useMessage } from "@/contexts/MessageContext";
import useDebounce from "@/hooks/useDebounce";
import { Suspense, useState } from "react";
import Spinner from "../common/Spinner";
import Tab from "../common/Tab";
import MessageItem from "./MessageItem";
import MessageSearch from "./MessageSearch";

const MessageList = () => {
  const [activeTab, setActiveTab] = useState("all");

  const [nickname, setNickname] = useState<string>("");
  const debouncedNickname = useDebounce(nickname, 500);

  return (
    <div className="h-full w-[100vw] flex flex-col px-4 md:px-0 md:min-w-[260px] md:w-[260px]">
      <Tab
        tabs={[
          { label: "전체", value: "all" },
          { label: "안 읽음", value: "unread" },
        ]}
        style="black"
        activeTab={activeTab}
        onTabChange={(value) => {
          setActiveTab(value);
        }}
      />
      <MessageSearch
        onChange={(event) => setNickname(event.target.value)}
        value={nickname}
      />
      <div className="md:border md:border-gray-300 scroll-hidden md:scroll flex-1 flex flex-col rounded-xl mt-4 max-w-full h-full overflow-y-auto min-h-[500px]">
        <Suspense
          fallback={
            <div className="m-auto">
              <Spinner />
            </div>
          }
        >
          <MessageListContainer
            nickName={debouncedNickname}
            filter={activeTab}
          />
        </Suspense>
      </div>
    </div>
  );
};

const MessageListContainer = ({
  nickName,
  filter,
}: {
  nickName: string;
  filter: string;
}) => {
  const { selectedMessageId } = useMessage();
  const { data } = useSelectMessageChatRooms(
    filter as "all" | "unread",
    nickName || undefined,
    1,
    20
  );

  return data?.results?.map((item) => {
    return (
      <MessageItem
        active={selectedMessageId === String(item.room_id)}
        key={item.room_id}
        id={String(item.room_id)}
        name={item.other_user_nickname}
        picture={item.other_user_profile_image_path}
        content={item.last_message_content}
        createdAt={item.last_message_date}
        unreadCount={item.unread_message_count}
        chatRoom={item}
      />
    );
  });
};

export default MessageList;

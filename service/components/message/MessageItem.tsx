import { useMessage } from "@/contexts/MessageContext";
import { IChatRoom } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";
import UserProfilePicture from "./UserProfilePicture";

interface IMessageProps {
  name: string;
  content: string;
  createdAt: string;
  picture?: string;
  unreadCount?: number;
  active: boolean;
  id: string;
  chatRoom: IChatRoom;
}

const MessageItem = ({
  content,
  createdAt,
  name,
  picture,
  active,
  id,
  unreadCount,
  chatRoom,
}: IMessageProps) => {
  const { setSelectedMessageId, setSelectedChatRoom } = useMessage();

  const handleClick = () => {
    setSelectedMessageId(id);
    setSelectedChatRoom(chatRoom);
  };

  return (
    <div
      onClick={handleClick}
      className={`items-center relative flex gap-4 md:gap-2 border-t py-4 md:p-4 first:border-t-0 hover:bg-light-gray-100 ${
        active ? "border-l-4 border-l-primary-100 bg-light-gray-100" : ""
      }`}
    >
      <UserProfilePicture picture={picture} />
      <div className={"flex gap-3 flex-col flex-1 w-full"}>
        <div className="flex justify-between">
          <span className="font-semibold">{name}</span>
          <span className="text-12pxr text-dark-gray-300 font-normal">
            {getFormattingDate(createdAt, "YYYY.MM.DD")}
          </span>
        </div>
        <div className="flex justify-between">
          <div className="text-ellipsis overflow-hidden line-clamp-2">
            {content}
          </div>
          <div className="ml-2">
            {unreadCount ? (
              <div className="right-4 w-[24px] h-[24px] flex rounded-full items-center justify-center bg-[#FF7700] text-white font-medium text-13pxr">
                {unreadCount}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

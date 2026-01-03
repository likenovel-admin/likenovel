import { useMessage } from "@/contexts/MessageContext";
import MessageChatRoom from "./MessageChatRoom";
import MessageList from "./MessageList";

const MessageContainer = () => {
  const { selectedMessageId } = useMessage();
  return (
    <div className="flex w-full mx-auto mt-5 gap-4">
      <MessageList />
      {selectedMessageId && <MessageChatRoom />}
    </div>
  );
};

export default MessageContainer;

import { useEffect } from "react";
import MessageChatInput from "./MessageChatInput";
import MessageChatList from "./MessageChatList";
import MessageHeader from "./MessageHeader";

const MessageChatRoom = () => {
  useEffect(() => {
    const body = document.querySelector("body");
    body?.classList.add("overflow-hidden");
    body?.classList.add("md:overflow-auto");
    return () => {
      body?.classList.remove("overflow-hidden");
      body?.classList.remove("md:overflow-auto");
    };
  }, []);
  return (
    <div className="w-screen h-screen bg-[#EBF2FF] flex flex-col fixed top-0 left-0 z-[1] md:relative md:rounded-xl border md:h-auto md:w-full overflow-hidden">
      <MessageHeader />
      <MessageChatList />
      <MessageChatInput />
    </div>
  );
};

export default MessageChatRoom;

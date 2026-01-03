import { useSendMessage } from "@/app/api/query/message";
import { useMessage } from "@/contexts/MessageContext";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import Button from "../common/Button";

const MessageChatInput = () => {
  const [message, setMessage] = useState("");
  const { selectedMessageId } = useMessage();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSendMessage = () => {
    if (!message.trim() || !selectedMessageId) return;

    sendMessage(
      {
        room_id: selectedMessageId,
        body: { content: message.trim() },
      },
      {
        onSuccess: () => {
          setMessage("");
          // Refetch chat room details to show the new message
          queryClient.invalidateQueries({
            queryKey: ["selectChatRoomDetail", selectedMessageId],
          });
        },
        onError: (error) => {
          console.error("Failed to send message:", error);
          setToast({
            message: "메시지 전송에 실패했습니다.",
            type: "error",
          });
        },
      }
    );
  };
  return (
    <div className="h-[76px] md:h-[60px] bottom-0 w-full p-3 md:p-2 flex items-center bg-white md:rounded-0 rounded-t-3xl md:rounded-none">
      <textarea
        onKeyUp={(e) => {
          if (e.key === "Enter" && !isPending) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        disabled={isPending}
        className="block md:hidden w-full h-full border-gray-300 border rounded-full py-3 px-6 resize-none focus:outline-none placeholder:translate-y-1 disabled:opacity-50"
        placeholder="메시지를 입력하세요"
      ></textarea>
      <textarea
        onKeyUp={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isPending) {
            e.preventDefault();
            handleSendMessage();
          }

          if (e.key === "Enter" && e.shiftKey) {
            console.log("줄바꿈");
          }
        }}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        disabled={isPending}
        className="md:block hidden w-full h-full border-none p-2 resize-none focus:outline-none placeholder:translate-y-1  placeholder:translate-x-2 disabled:opacity-50"
        placeholder="메시지를 입력하세요(Enter: 전송/ Shift+Enter 줄바꿈)"
      ></textarea>
      <button
        className="absolute right-5 md:hidden block disabled:opacity-50"
        onClick={handleSendMessage}
        disabled={isPending || !message.trim()}
      >
        <Image
          src="/images/icon_chat_send_btn.svg"
          alt="전송"
          width={34}
          height={34}
        />
      </button>
      <Button
        variant="gray"
        size="sm"
        className="absolute right-4 hidden md:block"
        onClick={handleSendMessage}
        disabled={isPending || !message.trim()}
      >
        {isPending ? "전송 중..." : "전송"}
      </Button>
    </div>
  );
};

export default MessageChatInput;

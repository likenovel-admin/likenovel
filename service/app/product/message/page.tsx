"use client";
import Modal from "@/components/common/Modal";
import MessageContainer from "@/components/message/MessageContainer";
import { MessageProvider } from "@/contexts/MessageContext";
const Page = () => {
  return (
    <MessageProvider>
      <div className="flex w-full max-w-[1120px] mx-auto mt-5 max-h-[calc(100vh-160px)]">
        <MessageContainer />
      </div>
      <Modal size="sm" />
    </MessageProvider>
  );
};

export default Page;

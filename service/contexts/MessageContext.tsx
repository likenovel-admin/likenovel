"use client";
import { IChatRoom } from "@/types";
import { createContext, ReactNode, useContext, useState } from "react";

interface MessageContextType {
  selectedMessageId: string | null;
  selectedChatRoom: IChatRoom | null;
  removeMessageId: () => void;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedChatRoom: React.Dispatch<React.SetStateAction<IChatRoom | null>>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [selectedChatRoom, setSelectedChatRoom] = useState<IChatRoom | null>(
    null
  );

  const removeMessageId = () => {
    setSelectedMessageId(null);
    setSelectedChatRoom(null);
  };

  return (
    <MessageContext.Provider
      value={{
        selectedMessageId,
        setSelectedMessageId,
        selectedChatRoom,
        setSelectedChatRoom,
        removeMessageId,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
};

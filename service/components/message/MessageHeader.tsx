import { useReportChat } from "@/app/api/query/message";
import { TYPE_MODAL } from "@/constants/common";
import { useMessage } from "@/contexts/MessageContext";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Suspense } from "react";
import SimpleMenu from "../common/SimpleMenu";
import Spinner from "../common/Spinner";
import UserProfilePicture from "./UserProfilePicture";

const MessageHeader = () => {
  const { selectedChatRoom, removeMessageId } = useMessage();

  const { setConfirm } = useConfirmStore();
  const { setTypeModal } = useModalStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const reportChat = useReportChat();

  const handleReportClick = () => {
    setTypeModal(TYPE_MODAL.REPORT_REASON, {
      type: "chat",
      onSubmit: (reason: string, detail: string) => {
        if (reportChat.isPending) return;
        reportChat.mutate(
          {
            room_id: (selectedChatRoom?.room_id || "") + "",
            body: { report_reason: reason, report_detail: detail },
          },
          {
            onSuccess: () => {
              setToast({
                message: "채팅이 신고되었습니다.",
                type: "success",
              });
              // Refetch chat rooms data
              queryClient.invalidateQueries({
                queryKey: ["selectMessageChatRooms"],
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "채팅 신고에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      },
    });
  };

  const handleLeaveChatRoom = () => {
    removeMessageId();
  };

  return (
    <>
      <button onClick={removeMessageId} className="md:hidden">
        <Image
          src="/images/arrow-left-small.svg"
          alt="back"
          width={9}
          height={16}
        />
      </button>
      <div className="flex gap-4 justify-between items-center">
        <UserProfilePicture
          picture={selectedChatRoom?.other_user_profile_image_path || ""}
        />
        <div className="font-semibold">
          {selectedChatRoom?.other_user_nickname}
        </div>
      </div>
      <SimpleMenu
        menuList={[
          {
            title: "신고",
            onClick: handleReportClick,
          },
          {
            title: "채팅방 나가기",
            onClick: handleLeaveChatRoom,
          },
        ]}
      />
    </>
  );
};

const MessageHeaderContainer = () => {
  return (
    <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-[50] md:z-1 w-full">
      <Suspense
        fallback={
          <div className="m-auto">
            <Spinner />
          </div>
        }
      >
        <MessageHeader />
      </Suspense>
    </div>
  );
};

export default MessageHeaderContainer;

import { useUserSendNotificationToBookmarkedUsers } from "@/app/api/query/mypage/user";
import useMediaDevice from "@/hooks/useMediaDevice";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import BottomSheetContainer from "../common/BottomSheetContainer";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import TextArea from "../form/textarea";

const SendAlarmModal = ({ isOpen, onClose }: CommonModalProps) => {
  const device = useMediaDevice();
  console.log(device);
  if (device === "mobile") {
    return (
      <BottomSheetContainer
        title="알림 보내기"
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlarmContents onClose={onClose} />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer
        title="알림 보내기"
        isOpen={isOpen}
        onClose={onClose}
        size="full"
      >
        <AlarmContents onClose={onClose} />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

export const AlarmContents = ({
  onClose,
  onConfirm,
  productId,
}: {
  onClose?: () => void;
  onConfirm?: () => void;
  productId?: number;
}) => {
  const [content, setContent] = useState("");
  const { closeModal } = useModalStore();
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const sendNotificationMutation = useUserSendNotificationToBookmarkedUsers();

  const handleSendNotification = () => {
    if (!productId) {
      setToast({
        message: "상품 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    if (!content.trim()) {
      setToast({
        message: "알림 내용을 입력해주세요.",
        type: "error",
      });
      return;
    }

    if (content.length > 50) {
      setToast({
        message: "알림 내용은 50자 이내로 입력해주세요.",
        type: "error",
      });
      return;
    }

    if (sendNotificationMutation.isPending) return;

    sendNotificationMutation.mutate(
      {
        productId,
        data: {
          content: content.trim(),
        },
      },
      {
        onSuccess: () => {
          setToast({
            message: "독자들에게 알림을 보냈습니다.",
            type: "success",
          });
          // Refetch product detail and user products
          queryClient.invalidateQueries({
            queryKey: ["selectProductDetail", productId],
          });
          setContent("");
          closeModal();
          onConfirm && onConfirm();
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message || "알림 보내기에 실패했습니다.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="h-fit flex flex-col items-center md:w-[450px]">
      <div className="flex flex-col items-center p-4 md:p-8 w-full">
        <div className="md:hidden block text-18pxr font-semibold p-2 whitespace-pre text-center">{`선호작을 등록한 독자에게 
알림을 보냅니다.`}</div>
        <div className="hidden md:block text-18pxr font-semibold p-2 whitespace-pre text-center">{`선호작을 등록한 독자에게 알림을 보냅니다.`}</div>
        <div className="text-14pxr text-gray-600 mb-6">
          한 주에 5회만 가능하며, 매주 월요일에 초기화됩니다.
        </div>
        <TextArea
          full
          placeholder="50자 이내"
          maxLength={50}
          inputStyle="w-full h-[150px] md:h-[200px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center gap-1 w-full mt-1">
          <Image
            src="/images/causion-red.svg"
            alt="주의"
            width={20}
            height={20}
          />
          <div className="text-11pxr md:text-12pxr text-gray-600">
            너무 많은 알림을 보낼 경우, 독자가 피곤해 할 수 있습니다.
          </div>
        </div>
      </div>
      <div className="w-full mt-4">
        <ModalBottomButton
          rightButton={{
            text: "보내기",
            onClick: handleSendNotification,
            disabled: sendNotificationMutation.isPending || !content.trim(),
            className: "border-[#EFF0F4] text-[#4D5159]",
          }}
          leftButton={{
            text: "취소",
            onClick: closeModal,
            className: "border-[#EFF0F4] text-[#4D5159]",
          }}
        />
      </div>
    </div>
  );
};
export default SendAlarmModal;

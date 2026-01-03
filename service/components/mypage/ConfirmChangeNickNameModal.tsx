import useModalStore from "@/store/modalStore";
import Button from "../common/Button";
import Close from "/public/images/close.svg";

interface FormData {
  nickname: string;
  badge: string[];
  isDefault: boolean;
  profileImage?: File;
}

interface ConfirmChangeNickNameModalProps {
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ConfirmChangeNickNameModal = ({
  onConfirm,
  onCancel,
}: ConfirmChangeNickNameModalProps) => {
  const { closeModal } = useModalStore();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      closeModal();
    }
  };

  return (
    <div className="w-full md:max-w-[420px] h-full overflow-hidden">
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              closeModal();
            }
          }}
          className="mt-4 mr-4"
        >
          <Close className="w-[15px] h-[15px]" />
        </button>
      </div>
      <div className="mt-[22px] h-full overflow-y-auto flex flex-col items-center justify-center">
        <p className="text-18pxr leading-[25px] tracking-[-2%] font-semibold text-black-100">
          무료 닉네임 변경횟수 3회를
        </p>
        <p className="text-18pxr leading-[25px] tracking-[-2%] font-semibold text-black-100">
          모두 사용했습니다.
        </p>
        <p className="mt-[9px] text-14pxr leading-[20px] tracking-[-2%] font-normal text-dark-gray-500">
          추가 변경이 필요할 경우{" "}
          <span className="font-semibold text-primary-100">500원</span>으로
        </p>
        <p className="text-14pxr leading-[20px] tracking-[-2%] font-normal text-dark-gray-500">
          1회 충전이 가능합니다.
        </p>
      </div>
      <div className="mt-[39px] border border-t-light-gray-200 pt-[24px] pb-[35px] px-[34px] flex gap-8pxr w-full">
        <Button
          className="flex-[36] hidden md:block"
          variant="secondary"
          size={"md"}
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button
          className="md:flex-[64] flex-[100]"
          size={"md"}
          onClick={onConfirm}
        >
          변경권 구입 500원
        </Button>
      </div>
    </div>
  );
};

export default ConfirmChangeNickNameModal;

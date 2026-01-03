import useMediaDevice from "@/hooks/useMediaDevice";
import { useState } from "react";
import BottomSheetContainer from "../common/BottomSheetContainer";
import Button from "../common/Button";
import MessageBubble from "../common/MessageBubble";
import ModalContainer from "../common/ModalContainer";
import SettingLevel from "../viewer/SettingLevel";

interface PromotionModalModalProps extends CommonModalProps {}

const PromotionModalModal = ({ isOpen, onClose }: PromotionModalModalProps) => {
  const device = useMediaDevice();
  console.log(device);
  if (device === "mobile") {
    return (
      <BottomSheetContainer
        title="직접 프로모션"
        isOpen={isOpen}
        onClose={onClose}
      >
        <PromotionModalContents onClose={onClose} />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer
        isOpen={isOpen}
        onClose={onClose}
        title="직접 프로모션"
        size="full"
      >
        <PromotionModalContents onClose={onClose} />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

const PromotionModalContents = ({ onClose }: { onClose: () => void }) => {
  const [count, setCount] = useState(3);
  return (
    <div className="h-fit flex flex-col items-center md:w-[530px]">
      <div className="flex flex-col bg-light-gray-100 gap-2 md:gap-1 p-4 pb-6 w-full">
        <div className="flex justify-between bg-white rounded-xl p-3 relative">
          <div className="absolute top-[-10px] left-[0px]">
            <MessageBubble>진행중</MessageBubble>
          </div>
          <div className="px-4 text-16pxr md:text-20pxr flex flex-col font-medium ">
            첫 방문자 무료 이용권
            <span className="text-14pxr md:text-16pxr font-normal text-gray-500">
              명당 증정 이용권
            </span>
          </div>
          <div className="flex items-end flex-col gap-2">
            <SettingLevel count={count} setCount={setCount} maximum={18} />
            <Button size="sm" className="w-[70px]">
              시작
            </Button>
          </div>
        </div>
        <div className="flex justify-between bg-white rounded-xl p-3 relative">
          <div className="px-4 text-16pxr md:text-20pxr flex flex-col font-medium ">
            첫 방문자 무료 이용권
            <span className="text-14pxr md:text-16pxr font-normal text-gray-500">
              명당 증정 이용권
            </span>
          </div>
          <div className="flex items-end flex-col gap-2">
            <SettingLevel count={count} setCount={setCount} maximum={18} />
            <Button size="sm" variant="black" className="w-[70px]">
              중지
            </Button>
          </div>
        </div>
        <div className="flex justify-between bg-white rounded-xl p-3">
          <div className="px-4 text-16pxr md:text-20pxr flex flex-col font-medium ">
            첫 방문자 무료 이용권
            <span className="text-14pxr md:text-16pxr font-normal text-gray-500">
              명당 증정 이용권
            </span>
          </div>
          <div className="flex items-end flex-col gap-2">
            <SettingLevel count={count} setCount={setCount} maximum={18} />
            <Button
              size="sm"
              className="w-[70px] !px-0 text-dark-gray-200"
              variant="gray"
              disabled
            >
              발급완료
            </Button>
          </div>
        </div>
        <div className="flex justify-between bg-white rounded-xl p-3">
          <div className="px-4 text-16pxr md:text-20pxr flex flex-col font-medium ">
            선작 구독자 무료 대여권
            <span className="text-14pxr md:text-16pxr font-normal text-gray-500">
              명당 증정 이용권
            </span>
            <span className="flex items-center gap-1 mt-1">
              <div className="w-[14px] h-[14px] rounded-full bg-[#F57C20] flex justify-center items-center">
                <span className="text-14pxr font-normal text-white">!</span>
              </div>
              <span className="text-12pxr md:text-14pxr font-normal text-gray-500">
                매주 월요일 초기화
              </span>
            </span>
          </div>
          <div className="flex items-end flex-col gap-2">
            <SettingLevel count={count} setCount={setCount} maximum={18} />
            <Button size="sm" className="w-[70px] !bg-[#0CA9DC]">
              발급
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`sticky bottom-0 bg-white mt-0 flex justify-between items-center w-full h-fit`}
      >
        <Button
          variant="secondary"
          className={`flex-[2] rounded-none text-14pxr md:text-16pxr font-medium h-[48px] md:h-[60px]`}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          variant="secondary"
          className={`flex-[2] rounded-none text-14pxr md:text-16pxr font-medium h-[48px] md:h-[60px] text-primary-100 border-l-0`}
          onClick={onClose}
        >
          확인
        </Button>
      </div>
    </div>
  );
};
export default PromotionModalModal;

"use client";
import { TYPE_MODAL } from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import useModalStore from "@/store/modalStore";
import Image from "next/image";
import BottomSheetContainer from "../common/BottomSheetContainer";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";

interface RentalStatusModalProps extends CommonModalProps {
  title: string;
}
const RentalStatusModal = () => {
  const device = useMediaDevice();
  const { typeModal, closeTypeModal, typeModalData } = useModalStore();
  const isOpen = typeModal === TYPE_MODAL.RENTAL_STATUS;
  if (device === "mobile") {
    return (
      <BottomSheetContainer
        title={typeModalData?.title}
        isOpen={isOpen}
        onClose={closeTypeModal}
      >
        <RentalStatusContents onClose={closeTypeModal} data={typeModalData} />
      </BottomSheetContainer>
    );
  } else if (
    device === "tablet" ||
    device === "desktop" ||
    device === "miniTablet"
  ) {
    return (
      <ModalContainer
        title={typeModalData?.title}
        isOpen={isOpen}
        onClose={closeTypeModal}
        size="full"
      >
        <RentalStatusContents onClose={closeTypeModal} data={typeModalData} />
      </ModalContainer>
    );
  } else {
    return null;
  }
};

const RentalStatusContents = ({
  onClose,
  data,
}: {
  onClose: () => void;
  data: any;
}) => {
  // Use ticket counts passed from parent component
  const ticketCounts = data?.ticketCounts || {
    free_for_first: 0,
    reader_of_prev: 0,
    waiting_for_free: 0,
    "6-9-path": 0,
    total: 0,
  };

  return (
    <div className="h-fit flex flex-col items-center md:w-[358px]">
      <div className="flex items-center gap-2 py-5 text-16pxr">
        <Image
          src={"/images/discount.svg"}
          alt="rental-status"
          width={19}
          height={16}
        />
        사용가능 대여권 총
        <span className="text-primary-100 font-bold">
          {ticketCounts.total}장
        </span>
      </div>
      <div className="h-2 bg-light-gray-100 w-full border-t"></div>
      <div className="flex flex-col w-full p-5">
        <ul className="list-disc list-inside text-14pxr text-gray-600">
          <li>
            첫방문자 무료 대여권{" "}
            <span className="text-black-100 font-medium">
              {ticketCounts.free_for_first}장
            </span>
          </li>
          <li>
            선작독자 무료 대여권{" "}
            <span className="text-black-100 font-medium ">
              {ticketCounts.reader_of_prev}장
            </span>
          </li>
          <li>
            기다무 대여권{" "}
            <span className="text-black-100 font-medium ">
              {ticketCounts.waiting_for_free}장
            </span>
          </li>
          <li>
            6-9패스 대여권{" "}
            <span className="text-black-100 font-medium ">
              {ticketCounts["6-9-path"]}장
            </span>
          </li>
          <li>
            기타 대여권{" "}
            <span className="text-black-100 font-medium ">
              {ticketCounts.other}장
            </span>
          </li>
          {/* <li>
            이벤트 대여권{" "}
            <span className="text-black-100 font-medium ">{ticketCounts.event}장</span>
          </li> */}
        </ul>
      </div>
      <div className="md:p-5 w-full">
        <div className="bg-light-gray-100 md:rounded-md p-5 pb-7 md:p-3 w-full text-11pxr md:text-12pxr text-gray-600 whitespace-pre-wrap break-keep">
          {
            "대여권은 6-9패스 대여권 > 선작독자 무료 대여권 > 첫방문자 무료 대여권  > 기다무 대여권 > 이벤트 대여권 순으로 자동 소진됩니다."
          }
        </div>
      </div>
      <div className="w-full mt-auto md:mt-4 sticky bottom-0 bg-white">
        <ModalBottomButton
          leftButton={{
            text: "취소",
            onClick: onClose,
          }}
        />
      </div>
    </div>
  );
};
export default RentalStatusModal;

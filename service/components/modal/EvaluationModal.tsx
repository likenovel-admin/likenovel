import { useState } from "react";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import ProductEvaluation from "../common/ProductEvaluation";

const EvaluationModal = ({ isOpen, onClose }: CommonModalProps) => {
  const [selectedValue, setSelectedValue] = useState("");
  return (
    <ModalContainer
      title="평가하기"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <div className="flex flex-col items-center md:w-[530px] h-full">
        <div className="flex flex-col items-center p-4 md:p-8 w-full">
          <div className="text-16pxr font-semibold flex gap-2 w-full py-2 items-center">
            평가
            <div className="text-13pxr font-normal text-dark-gray-300">
              | 총 <span className="font-medium text-primary-100">0000명</span>{" "}
              참여중
            </div>
          </div>
          <ProductEvaluation
            onChange={setSelectedValue}
            selectedValue={selectedValue}
          />
        </div>
        <div className="w-full mt-auto md:mt-4">
          <ModalBottomButton
            rightButton={{
              text: "평가완료",
              onClick: onClose,
              className: "text-primary-100",
            }}
            leftButton={{ text: "취소", onClick: onClose }}
          />
        </div>
      </div>
    </ModalContainer>
  );
};

export default EvaluationModal;

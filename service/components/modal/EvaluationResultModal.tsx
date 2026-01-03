import { useSelectProductDetail } from "@/app/api/query/product";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import ProductReaction from "../common/ProductReaction";

const EvaluationResultModal = ({ isOpen, onClose }: CommonModalProps) => {
  const { data } = useSelectProductDetail(174);
  return (
    <ModalContainer
      title="평가결과 확인"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <div className="flex flex-col items-center md:w-[560px] h-full">
        <div className="flex flex-col items-center p-4 md:p-8 w-full">
          <div className="text-16pxr font-semibold flex gap-2 w-full py-2 items-center">
            평가
            <div className="text-13pxr font-normal text-dark-gray-300">
              | 총 <span className="font-medium text-primary-100">0000명</span>{" "}
              참여중
            </div>
          </div>
          <div className="w-full">
            {data?.data.evaluations && (
              <ProductReaction evaluations={data?.data.evaluations} />
            )}
          </div>
        </div>
        <div className="w-full mt-auto md:mt-4">
          <ModalBottomButton rightButton={{ text: "확인", onClick: onClose }} />
        </div>
      </div>
    </ModalContainer>
  );
};
export default EvaluationResultModal;

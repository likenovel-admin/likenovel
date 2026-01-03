import useModalStore from "@/store/modalStore";
import Button from "../common/Button";
import Warning from "/public/images/warning.svg";
interface Props {
  content: string | JSX.Element;
  onConfirm?: () => void;
}
const WarningModal = ({ content, onConfirm }: Props) => {
  const { closeModal } = useModalStore();
  return (
    <div className="flex flex-col items-center justify-center pb-[30px]">
      <Warning className="w-[50px] mb-20pxr" />
      {content}
      <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 mt-30pxr" />
      <Button
        variant="primary"
        size="xl"
        className="w-[80%] mt-20pxr"
        onClick={() => {
          onConfirm && onConfirm();
          closeModal();
        }}
      >
        확인
      </Button>
    </div>
  );
};
export default WarningModal;

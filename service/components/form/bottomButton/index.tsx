import Button from "../../common/Button";
interface BottomButtonProps {
  cancelText?: string;
  submitText?: string;
  onCancelClick?: () => void;
  onSubmitClick?: () => void;
  disabled?: boolean;
  disabledSubmit?: boolean;
}
const BottomButton = ({
  cancelText = "취소",
  onCancelClick,
  onSubmitClick,
  submitText = "등록",
  disabled = false,
  disabledSubmit = false,
}: BottomButtonProps) => {
  return (
    <div className="flex gap-1 w-full justify-center pt-4 px-16pxr pb-16pxr bg-white md:border-t mt-auto sticky bottom-0">
      <div className="hidden md:flex md:max-w-[70%] gap-1 w-full">
        <Button
          className="flex-[40] rounded-[14px]"
          variant="secondary"
          size={"xl"}
          onClick={onCancelClick}
          disabled={disabled}
        >
          {cancelText}
        </Button>
        <Button
          className="flex-[60] rounded-[14px]"
          size={"xl"}
          onClick={onSubmitClick}
          disabled={disabled || disabledSubmit}
        >
          {submitText}
        </Button>
      </div>
      <div className="flex md:hidden gap-1 w-full">
        <Button
          className="flex-[15]"
          variant="secondary"
          size={"md"}
          onClick={onCancelClick}
          disabled={disabled}
        >
          {cancelText}
        </Button>
        <Button
          className="flex-[85]"
          size={"md"}
          onClick={onSubmitClick}
          disabled={disabled || disabledSubmit}
        >
          {submitText}
        </Button>
      </div>
    </div>
  );
};

export default BottomButton;

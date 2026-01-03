import Button from "./Button";

interface ModalBottomButtonProps {
  leftButton?: {
    text: string;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
  };
  rightButton?: {
    text: string;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
  };
}

const ModalBottomButton = ({
  leftButton,
  rightButton,
}: ModalBottomButtonProps) => {
  return (
    <div
      className={`flex justify-between p-4 ${
        !rightButton ? "p-0" : ""
      }  md:p-0  gap-1 md:gap-0 items-center w-full md:h-[60px]`}
    >
      {leftButton && (
        <Button
          disabled={leftButton.disabled}
          variant="secondary"
          className={`flex-[2] ${
            !rightButton ? "rounded-none text-18pxr h-[60px]" : ""
          } md:rounded-none md:h-full md:text-18pxr ${
            leftButton.className ?? ""
          }`}
          onClick={leftButton.onClick}
          type={leftButton.type}
        >
          {leftButton.text}
        </Button>
      )}
      {rightButton && (
        <>
          <Button
            variant="black"
            disabled={rightButton.disabled}
            className={`flex-[8] block md:hidden ${
              rightButton.className ?? ""
            }`}
            onClick={rightButton.onClick}
            type={rightButton.type}
          >
            {rightButton.text}
          </Button>
          <Button
            variant="secondary"
            className={`flex-[2] md:block hidden md:rounded-none h-full text-18pxr ${
              rightButton.className ?? ""
            }`}
            onClick={rightButton.onClick}
            type={rightButton.type}
          >
            {rightButton.text}
          </Button>
        </>
      )}
    </div>
  );
};

export default ModalBottomButton;

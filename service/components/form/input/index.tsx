import Button from "@/components/common/Button";
import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useMemo,
  useState,
} from "react";
import CircleWarn from "/public/images/circle-warn.svg";
import PasswordHide from "/public/images/password-hide.svg";
import PasswordView from "/public/images/password-view.svg";
import SuccessCircle from "/public/images/success-circle.svg";
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  labelStyle?: string;
  inputStyle?: string;
  gap?: string;
  placeholder?: string;
  type?: string;
  isError?: boolean | null;
  successText?: ReactNode;
  errorText?: ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  additionalText?: ReactNode;
  isButtonDisabled?: boolean;
  options?: { value: string; label: ReactNode }[];
  optionsStyle?: string;
  activeOptionStyle?: string;
  checkedValue?: string;
  name?: string;
  isLoading?: boolean;
  full?: boolean;
  hasErrorIcon?: boolean;
  hasSuccessIcon?: boolean;
}

const Input = (
  {
    label,
    labelStyle,
    inputStyle,
    gap,
    placeholder,
    full,
    type,
    successText,
    isError,
    errorText,
    buttonText,
    onButtonClick,
    isButtonDisabled,
    options,
    name,
    value,
    checkedValue,
    isLoading,
    optionsStyle,
    activeOptionStyle,
    additionalText,
    hasErrorIcon = true,
    hasSuccessIcon = true,
    ...props
  }: InputProps,
  ref: React.Ref<HTMLInputElement>
) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputErrorStyle = useMemo(() => {
    return isError
      ? "border-[2px] border-red-100 bg-[#FFF4F4]"
      : "border border-light-gray-500";
  }, [isError]);
  return (
    <div className={`flex-column gap-[8px] relative ${full ? "w-full" : ""}`}>
      <div className={`flex flex-col ${gap}`}>
        {label && (
          <label className={`min-w-[100px] ${labelStyle}`}>{label}</label>
        )}
        {options ? (
          <div className="flex gap-[10px] flex-wrap">
            {options.map((option) => {
              const isChecked = checkedValue === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex items-center cursor-pointer ${optionsStyle} ${
                    isChecked ? activeOptionStyle : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={isChecked}
                    className="hidden peer"
                    ref={ref}
                    {...props}
                  />
                  <span className="w-[20px] h-[20px] border-[1px] peer-checked:border-[5px] border-light-gray-500 rounded-full peer-checked:border-primary-100 flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full peer-checked:block hidden"></span>
                  </span>
                  <span className="ml-[7px] text-14pxr text-dark-gray-400 peer-checked:text-dark-gray-700">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        ) : type === "password" ? (
          <div className="relative">
            <input
              ref={ref}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={placeholder}
              name={name}
              value={value}
              className={`${inputErrorStyle} rounded-[8px] pl-[15px] ${inputStyle}`}
              {...props}
            />
            <button
              type="button"
              className="absolute right-[15px] top-[30%] text-dark-gray-500"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <PasswordView className="w-[18px] h-[18px]" />
              ) : (
                <PasswordHide className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        ) : (
          <div className="relative flex items-center">
            <input
              ref={ref}
              placeholder={placeholder}
              name={name}
              value={value}
              className={`${inputErrorStyle} rounded-[8px] pl-[15px] ${inputStyle}`}
              {...props}
            />
            {additionalText && (
              <div className="absolute right-0">{additionalText}</div>
            )}
          </div>
        )}
        {buttonText && (
          <Button
            type="button"
            size="sm"
            onClick={onButtonClick}
            disabled={isButtonDisabled}
            isLoading={isLoading}
          >
            {buttonText}
          </Button>
        )}
      </div>
      {isError ? (
        <span
          className={
            "flex items-center mt-[8px] text-12pxr text-red-100 gap-3pxr"
          }
        >
          {hasErrorIcon && <CircleWarn className="w-[13px] h-[13px]" />}
          {errorText}
        </span>
      ) : !isError && successText ? (
        <span
          className={
            "flex items-center mt-[8px] text-12pxr text-[#0CA9DC] gap-3pxr"
          }
        >
          {hasSuccessIcon && <SuccessCircle className="w-[13px] h-[13px]" />}
          {successText}
        </span>
      ) : (
        ""
      )}
    </div>
  );
};

export default forwardRef(Input);

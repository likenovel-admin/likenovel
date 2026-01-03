import { forwardRef, InputHTMLAttributes, ReactNode, Ref } from "react";

export interface TextAreaProps
  extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  labelStyle?: string;
  inputStyle?: string;
  placeholder?: string;
  isError?: boolean | null;
  successText?: ReactNode;
  errorText?: ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  additionalText?: ReactNode;
  full?: boolean;
  value?: string;
}

const TextArea = forwardRef(function TextAreaComponent(
  {
    label,
    labelStyle,
    full,
    inputStyle,
    additionalText,
    onChange,
    value,
    ...props
  }: TextAreaProps,
  ref: Ref<HTMLTextAreaElement>
) {
  return (
    <div
      className={`flex-column gap-[8px] mb-[10px] relative ${
        full ? "w-full" : ""
      }`}
    >
      <div className={`flex flex-col`}>
        <label className={`min-w-[100px] ${labelStyle}`}>{label}</label>
        <div className="relative flex items-center">
          <textarea
            ref={ref}
            onChange={onChange}
            value={value}
            className={`border border-light-gray-500 rounded-[8px] p-[16px] h-400pxr ${inputStyle}`}
            {...props}
          ></textarea>
          {additionalText && (
            <div className="absolute right-3 bottom-3">{additionalText}</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TextArea;

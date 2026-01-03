import { forwardRef, InputHTMLAttributes } from "react";
import Check from "/public/images/check.svg";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value"> {
  label: string | React.ReactNode;
  labelId?: string;
  labelStyle?: string;
  checkBoxStyle?: string;
  checked?: boolean;
  checkedColor?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = (
  {
    label,
    labelId,
    labelStyle,
    checkBoxStyle = "w-[20px] h-[20px] border",
    checked,
    checkedColor = "bg-black-100",
    onChange,
    ...props
  }: Props,
  ref: React.Ref<HTMLInputElement>
) => {
  return (
    <div className="flex items-center">
      <label
        htmlFor={typeof label === "string" ? label : labelId}
        className={`flex items-center cursor-pointer ${labelStyle}`}
      >
        <input
          type="checkbox"
          ref={ref}
          {...props}
          id={typeof label === "string" ? label : labelId}
          className="hidden"
          checked={checked}
          onChange={onChange}
        />
        <div
          className={`flex justify-center items-center ${checkBoxStyle} ${
            checked ? checkedColor : "border-light-gray-600"
          }  rounded-[6px] mr-[8px]`}
        >
          <Check className="w-[10px] h-[7px] text-light-gray-600" />
        </div>
        {label}
      </label>
    </div>
  );
};

export default forwardRef(Checkbox);

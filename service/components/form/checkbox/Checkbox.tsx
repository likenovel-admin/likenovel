import { ChangeEvent, forwardRef, ReactNode } from "react";

import Check from "/public/images/check.svg";
interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: "square" | "borderless";
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function CheckboxComponent(
    { label, checked, onChange, disabled, className, type = "borderless" },
    ref
  ) {
    return (
      <label
        className={`flex items-center cursor-pointer px-4 h-[46px] md:h-[50px] border border-1 rounded-[6px] gap-[6px] ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${
          checked ? "border-primary-100" : "border-light-gray-500"
        } ${className}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event)}
          disabled={disabled}
          ref={ref}
          hidden
          className="hidden peer"
        />
        {type === "borderless" ? (
          <Check
            className={`w-[13px] h-[9px] ${
              checked ? "text-primary-100" : "text-light-gray-500"
            }`}
          />
        ) : (
          <div
            className={`flex justify-center items-center w-[20px] h-[20px] border ${
              checked ? "bg-black-100" : "border-light-gray-600"
            }  rounded-[6px] mr-[8px]`}
          >
            <Check className="w-[10px] h-[7px] text-light-gray-600" />
          </div>
        )}
        <span className="ml-2 text-gray-700">{label}</span>
      </label>
    );
  }
);

export default Checkbox;

import { ChangeEvent, forwardRef } from "react";

interface SelectBoxProps {
  label?: string;
  labelClassName?: string;
  options: CommonSelectItem[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  full?: boolean;
}

const SelectBox = forwardRef<HTMLSelectElement, SelectBoxProps>(
  function SelectBoxComponent(
    {
      label,
      options,
      value,
      onChange,
      disabled,
      ariaLabel,
      labelClassName,
      className,
      full,
    },
    ref
  ) {
    return (
      <div className={`flex flex-col ${full ? "w-full" : ""}`}>
        <label className={labelClassName}>{label}</label>
        <select
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          ref={ref}
          onChange={onChange}
          className={`p-2 border border-gray-300 rounded-[8px] px-[15px] appearance-none bg-no-repeat bg-[url(/images/selectbox-arrow.svg)] bg-[right_10px_center] bg-[length:16px] ${
            className ?? ""
          }`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

export default SelectBox;

import { ReactNode } from "react";
import Checkbox from "./Checkbox";

interface CheckboxGroupProps {
  options: CommonSelectItem[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  disabled?: boolean;
  label?: ReactNode;
  checkboxClassName?: string;
  className?: string;
  type?: "square" | "borderless";
}

const CheckboxGroup = ({
  options,
  selectedValues,
  onChange,
  disabled,
  className,
  label,
  checkboxClassName,
  type,
}: CheckboxGroupProps) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="flex flex-col">
      {label && <label className={`min-w-[100px] ${className}`}>{label}</label>}
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => (
          <Checkbox
            type={type}
            key={option.value}
            label={option.label}
            className={checkboxClassName}
            checked={selectedValues.includes(option.value)}
            onChange={(event) =>
              handleCheckboxChange(option.value, event.target.checked)
            }
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;

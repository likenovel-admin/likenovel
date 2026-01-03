import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  useState,
} from "react";

export interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
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
  value?: string;
}

const Toggle = forwardRef(function ToggleComponent(
  {
    label,
    labelStyle,
    inputStyle,
    additionalText,
    onChange,
    value,
    checked,
    ...props
  }: ToggleProps,
  ref: Ref<HTMLInputElement>
) {
  const [internalToggle, setInternalToggle] = useState(false);
  const isChecked = checked !== undefined ? checked : internalToggle;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setInternalToggle(newChecked);
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div className={`flex-column gap-[8px] relative`}>
      <div className={`flex flex-col`}>
        {label && (
          <label className={`min-w-[100px] ${labelStyle}`}>{label}</label>
        )}

        <div className="flex items-center">
          <label
            className={`relative flex items-center justify-between border-[1px] rounded-full w-[46px] h-[26px] transition-all duration-500 p-[2px] ${
              isChecked ? "bg-primary-100" : "bg-light-gray-300"
            }`}
          >
            <input
              type="checkbox"
              ref={ref}
              {...props}
              checked={isChecked}
              onChange={handleChange}
              className="hidden"
            />
            <div
              className={`w-[20px] h-[20px] rounded-full flex items-center justify-center transition-transform duration-300 transform bg-white ${
                isChecked ? "translate-x-[20px]" : "translate-x-[0]"
              }`}
            ></div>
          </label>
        </div>
      </div>
    </div>
  );
});
export default Toggle;

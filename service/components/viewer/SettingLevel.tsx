import Minus from "/public/images/minus.svg";
import Plus from "/public/images/plus.svg";
interface Props {
  count: number;
  setCount: (size: number) => void;
  maximum?: number;
  disabled?: boolean;
}
const SettingLevel = ({ count, setCount, maximum = 5, disabled }: Props) => {
  const increase = () => {
    if (disabled) return;
    setCount(count < maximum ? count + 1 : maximum);
  };

  const decrease = () => {
    if (disabled) return;
    setCount(count > 1 ? count - 1 : 1);
  };
  return (
    <div className={`flex items-center gap-21pxr ${disabled ? "opacity-40" : ""}`}>
      <button
        className="flex justify-center items-center w-[34px] h-[34px] rounded-full border border-light-gray-400"
        onClick={decrease}
        disabled={disabled}
      >
        <Minus color={disabled || count <= 1 ? "#BFC2C9" : "var(--foreground-rgb)"} />
      </button>
      <div className="w-[10px]">{count}</div>
      <button
        className="flex justify-center items-center w-[34px] h-[34px] rounded-full border border-light-gray-400"
        onClick={increase}
        disabled={disabled}
      >
        <Plus color={disabled || count >= maximum ? "#BFC2C9" : "var(--foreground-rgb)"} />
      </button>
    </div>
  );
};
export default SettingLevel;

import Minus from "/public/images/minus.svg";
import Plus from "/public/images/plus.svg";
interface Props {
  count: number;
  setCount: (size: number) => void;
  maximum?: number;
  minimum?: number;
  disabled?: boolean;
  onIncreaseBlocked?: () => void;
}
const SettingLevel = ({
  count,
  setCount,
  maximum = 5,
  minimum = 1,
  disabled,
  onIncreaseBlocked,
}: Props) => {
  const isDecreaseDisabled = Boolean(disabled || count <= minimum);
  const isIncreaseDisabled = Boolean(
    disabled || (count >= maximum && !onIncreaseBlocked)
  );
  const isIncreaseBlocked = Boolean(!disabled && count >= maximum);

  const increase = () => {
    if (disabled) return;
    if (count >= maximum) {
      onIncreaseBlocked?.();
      return;
    }
    setCount(count + 1);
  };

  const decrease = () => {
    if (isDecreaseDisabled) return;
    setCount(count - 1);
  };
  return (
    <div className={`flex items-center gap-21pxr ${disabled ? "opacity-40" : ""}`}>
      <button
        type="button"
        className="flex justify-center items-center w-[34px] h-[34px] rounded-full border border-light-gray-400"
        onClick={decrease}
        disabled={isDecreaseDisabled}
      >
        <Minus
          color={
            isDecreaseDisabled ? "#BFC2C9" : "var(--foreground-rgb)"
          }
        />
      </button>
      <div className="w-[10px]">{count}</div>
      <button
        type="button"
        className="flex justify-center items-center w-[34px] h-[34px] rounded-full border border-light-gray-400"
        onClick={increase}
        disabled={isIncreaseDisabled}
        aria-disabled={disabled || count >= maximum}
      >
        <Plus color={isIncreaseBlocked ? "#BFC2C9" : "var(--foreground-rgb)"} />
      </button>
    </div>
  );
};
export default SettingLevel;

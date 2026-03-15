import Minus from "/public/images/minus.svg";
import Plus from "/public/images/plus.svg";
interface Props {
  count: number;
  setCount: (size: number) => void;
  maximum?: number;
  minimum?: number;
  disabled?: boolean;
}
const SettingLevel = ({
  count,
  setCount,
  maximum = 5,
  minimum = 1,
  disabled,
}: Props) => {
  const isDecreaseDisabled = Boolean(disabled || count <= minimum);
  const isIncreaseDisabled = Boolean(disabled || count >= maximum);

  const increase = () => {
    if (isIncreaseDisabled) return;
    setCount(count + 1);
  };

  const decrease = () => {
    if (isDecreaseDisabled) return;
    setCount(count - 1);
  };
  return (
    <div className={`flex items-center gap-21pxr ${disabled ? "opacity-40" : ""}`}>
      <button
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
        className="flex justify-center items-center w-[34px] h-[34px] rounded-full border border-light-gray-400"
        onClick={increase}
        disabled={isIncreaseDisabled}
      >
        <Plus color={isIncreaseDisabled ? "#BFC2C9" : "var(--foreground-rgb)"} />
      </button>
    </div>
  );
};
export default SettingLevel;

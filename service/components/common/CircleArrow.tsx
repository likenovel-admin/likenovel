import ArrowLeftSmall from "/public/images/arrow-left-small.svg";
import ArrowRightSmall from "/public/images/arrow-right-small.svg";
interface Props {
  direction: "left" | "right";
  onClick?: () => void;
  isDisabled?: boolean;
  color?: "white" | "black";
}
const CircleArrow = ({
  direction,
  onClick,
  isDisabled = false,
  color = "white",
}: Props) => {
  const baseStyles =
    color === "white"
      ? "flex justify-center items-center w-[42px] h-[42px] rounded-full border  border-light-gray-400"
      : "flex justify-center items-center w-[42px] h-[42px] rounded-full";
  const enabledStyles =
    color === "white"
      ? "bg-white text-dark-gray-300 hover:bg-light-gray-200 hover:text-black-100"
      : "bg-dark-gray-700 text-white hover:bg-dark-gray-600";
  const disabledStyles =
    color === "white"
      ? "bg-white text-light-gray-500"
      : "bg-dark-gray-700 text-dark-gray-400";

  return (
    <>
      {direction === "left" ? (
        <button
          className={`${baseStyles} ${
            isDisabled ? disabledStyles : enabledStyles
          }`}
          onClick={onClick}
          disabled={isDisabled}
        >
          <ArrowLeftSmall />
        </button>
      ) : (
        <button
          className={`${baseStyles} ${
            isDisabled ? disabledStyles : enabledStyles
          }`}
          onClick={onClick}
          disabled={isDisabled}
        >
          <ArrowRightSmall />
        </button>
      )}
    </>
  );
};

export default CircleArrow;

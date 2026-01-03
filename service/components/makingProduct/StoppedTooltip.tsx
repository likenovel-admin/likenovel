import { useState } from "react";
import QuestionMark from "/public/images/question-mark.svg";

const StoppedTooltip = () => {
  const [openHelper, setIsOpenHelper] = useState(false);
  return (
    <button
      className={`flex justify-center items-center w-[16px] h-[16px]  bg-dark-gray-300 rounded-full border border-light-gray-600 ${
        openHelper
          ? "bg-black-100 hover:bg-dark-gray-600"
          : "hover:bg-light-gray-100"
      }`}
      onClick={() => {
        setIsOpenHelper(true);
      }}
    >
      <QuestionMark className={`text-white w-[9px] h-[9px]`} />
    </button>
  );
};

export default StoppedTooltip;

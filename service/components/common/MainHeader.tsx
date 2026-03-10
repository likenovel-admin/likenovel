import TimeSpeechBubble from "../common/TimeSpeechBubble";
import ArrowRightSmall from "/public/images/arrow-right-small.svg";
import QuestionMark from "/public/images/question-mark.svg";
import type { ReactNode } from "react";
interface Props {
  headerText: ReactNode;
  textStyle?: string;
  hasTimeSpeechBubble?: boolean;
  hasMoreButton?: boolean;
  moreButtonOnClick?: () => void;
  hasGuide?: boolean;
}
const MainHeader = ({
  headerText,
  textStyle = "text-17pxr md:text-24pxr font-bold",
  hasTimeSpeechBubble = false,
  hasMoreButton = false,
  moreButtonOnClick,
  hasGuide = false,
}: Props) => {
  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-[8px] pl-16pxr md:pl-0">
        <span className={textStyle}>{headerText}</span>
        {hasTimeSpeechBubble && <TimeSpeechBubble />}
        {hasGuide && (
          <>
            {/* TODO: 가이드 추가 */}
            <button
              className="flex justify-center items-center w-[25px] h-[25px] rounded-full border border-light-gray-600 hover:bg-light-gray-100"
              onClick={() => {}}
            >
              <QuestionMark className="w-[8px] h-[12px] text-dark-gray-500" />
            </button>
          </>
        )}
      </div>
      {hasMoreButton && (
        <button
          className="flex items-center gap-8pxr p-2"
          onClick={moreButtonOnClick}
        >
          <span className="text-dark-gray-300 text-14pxr font-medium pr-16pxr md:pr-0">
            더보기
          </span>
          <ArrowRightSmall className="text-dark-gray-300 hidden md:block" />
        </button>
      )}
    </div>
  );
};
export default MainHeader;

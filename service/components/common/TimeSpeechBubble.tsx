import { useEffect, useState } from "react";
import { getFormattedRankBasisTime } from "@/utils/rankingBasis";
import ArrowRightMedium from "/public/images/arrow-right-medium.svg";
import Clock from "/public/images/clock-detail.svg";

interface TimeSpeechBubbleProps {
  mode?: "current" | "ranking";
  onClick?: () => void;
  ariaLabel?: string;
  showActionIndicator?: boolean;
}

const formatCurrentTime = (now: Date) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
};

const TimeSpeechBubble = ({
  mode = "current",
  onClick,
  ariaLabel = "시간대별 랭킹 보기",
  showActionIndicator = false,
}: TimeSpeechBubbleProps) => {
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);
  const isInteractive = Boolean(onClick);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime =
        mode === "ranking"
          ? getFormattedRankBasisTime(now)
          : formatCurrentTime(now);
      setCurrentTime(formattedTime);
      setLoading(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [mode]);

  if (loading) {
    return (
      <div
        className={`h-[24px] md:h-[28px] ${
          showActionIndicator ? "w-[144px] md:w-[178px]" : "w-[140px] md:w-[172px]"
        }`}
      />
    );
  }

  const content = (
    <>
      <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 h-[10px] w-[5px] bg-[#FFD339] [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
      <Clock className="relative z-10 h-[12px] w-[13px] md:h-[13px] md:w-[14px] shrink-0" />
      <span className="relative z-10 whitespace-nowrap text-[10px] md:text-[12px] font-medium leading-none">
        {currentTime} 기준
      </span>
      {showActionIndicator && (
        <ArrowRightMedium className="relative z-10 h-[8px] w-[5px] md:h-[10px] md:w-[6px] shrink-0 overflow-visible -translate-y-[0.6px] text-[#281E06]" />
      )}
    </>
  );

  const baseClassName =
    `relative inline-flex h-[24px] md:h-[28px] items-center gap-5pxr rounded-full bg-[#FFD339] ${
      showActionIndicator
        ? "pl-10pxr pr-11pxr md:pl-12pxr md:pr-13pxr"
        : "px-10pxr md:px-12pxr"
    } text-[#281E06]`;

  if (isInteractive) {
    return (
      <>
        <button
          type="button"
          aria-label={ariaLabel}
          className={`${baseClassName} hidden md:inline-flex cursor-pointer hover:bg-[#F5C928] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100`}
          onClick={onClick}
        >
          {content}
        </button>
        <div className={`${baseClassName} md:hidden`}>{content}</div>
      </>
    );
  }

  return (
    <div className={baseClassName}>
      {content}
    </div>
  );
};

export default TimeSpeechBubble;

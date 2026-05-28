import { useEffect, useState } from "react";
import { getFormattedRankBasisTime } from "@/utils/rankingBasis";
import Clock from "/public/images/clock-detail.svg";
import SpeechBubble from "/public/images/speech-bubble-yellow.svg";

interface TimeSpeechBubbleProps {
  mode?: "current" | "ranking";
}

const formatCurrentTime = (now: Date) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}. ${month}. ${day} ${hours}:${minutes}`;
};

const TimeSpeechBubble = ({ mode = "current" }: TimeSpeechBubbleProps) => {
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="relative flex">
      <SpeechBubble className="w-[140px] h-[22px] md:w-[160px] md:h-[26px]" />
      {loading ? (
        <></>
      ) : (
        <div className="flex">
          <Clock className="absolute z-10 top-[6px] left-[10px] w-[12px] h-[11px] md:w-[14px] md:h-[13px]" />
          <span className="absolute z-10 top-[4px] left-[28px] text-[10px] md:text-[12px] font-medium">
            {currentTime} 기준
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeSpeechBubble;

import { useEffect, useState } from "react";
import Clock from "/public/images/clock-detail.svg";
import SpeechBubble from "/public/images/speech-bubble-yellow.svg";

const TimeSpeechBubble = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${year}. ${month}. ${day} ${hours}:${minutes}`;
      setCurrentTime(formattedTime);
      setLoading(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

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

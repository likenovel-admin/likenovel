import Clock from "/public/images/clock.svg";

interface Props {
  type:
    | ("waitForFree" | "freeEpisodes" | "timePass")[] //기다무(시계) | n화무 | 타임패스
    | "up" //UP
    | "free" //무료
    | "paid" //유료
    | "end" //완결
    | "rest" //휴재
    | "stop" //연재중지
    | "new" //신작
    | "CPContract" //CP계약
    | "only" //독점
    | "reservation" //예약
    | "rental" //대여
    | "collect" //소장
    | "CP" //CP
    | "editor" //편집자
    | "enter" //엔터사
    | "author"; //작가
  size?: "small" | "large" | "header";
  freeEpisodeNumber?: number;
  timePassValue?: string;
}

const SquareBadge = ({
  type,
  size = "small",
  freeEpisodeNumber,
  timePassValue,
}: Props) => {
  const priceBadgeSizeClass =
    size === "large"
      ? "w-[30px] h-[20px]"
      : size === "header"
        ? "w-[27px] h-[18px]"
        : "w-[24px] h-[18px]";
  const priceBadgeTextSizeClass =
    size === "large" ? "text-12pxr" : "text-10pxr";
  const upBadgeWidthClass = size === "header" ? "w-[27px]" : "w-[18px]";

  const renderClockIcon = () => (
    <div
      className={`flex justify-center items-center min-w-[18px] h-[18px] p-[3px] bg-[#52CFF8]`}
    >
      <Clock className="w-[12px] h-[12px] text-black-100" />
    </div>
  );

  const renderFreeEpisodes = () => (
    <div className="flex justify-center items-center h-[18px] bg-white ">
      <span className="text-10pxr text-black-100 font-bold whitespace-nowrap p-[3px]">
        {freeEpisodeNumber}화무
      </span>
    </div>
  );

  const renderTimePass = () => (
    <div className="flex justify-center items-center min-w-[24px] h-[18px] bg-dark-gray-600 p-[3px]">
      <span className="text-10pxr text-white font-medium">
        {/* {timePassValue} */}
        6-9
      </span>
    </div>
  );

  const renderJob = (job: string) => (
    <div className="flex justify-center items-center w-[26px] h-[20px] bg-white border border-dark-gray-100 rounded-[5px]">
      <span className="text-12pxr text-dark-gray-500 font-medium">{job}</span>
    </div>
  );

  const badge = () => {
    switch (true) {
      case type === "up":
        return (
          <div
            className={`${upBadgeWidthClass} flex justify-center items-center h-[18px] bg-red-100 rounded-[5px]`}
          >
            <span className="text-10pxr text-white font-medium">UP</span>
          </div>
        );

      case Array.isArray(type) &&
        type.length === 1 &&
        type[0] === "waitForFree":
        return (
          <div className="flex justify-center items-center w-[18px] h-[18px] rounded-[5px] overflow-hidden">
            {renderClockIcon()}
          </div>
        );

      case Array.isArray(type) &&
        type.length === 1 &&
        type[0] === "freeEpisodes":
        return (
          <div className="flex h-[18px] rounded-[5px] overflow-hidden">
            {renderFreeEpisodes()}
          </div>
        );

      case Array.isArray(type) && type.length === 1 && type[0] === "timePass":
        return (
          <div className="flex min-w-[24px] h-[18px] rounded-[5px] overflow-hidden">
            {renderTimePass()}
          </div>
        );

      case Array.isArray(type) &&
        type.length === 2 &&
        type.includes("waitForFree") &&
        type.includes("freeEpisodes"):
        return (
          <div className="flex h-[18px] rounded-[5px] overflow-hidden">
            {renderClockIcon()}
            {renderFreeEpisodes()}
          </div>
        );

      case Array.isArray(type) &&
        type.length === 2 &&
        type.includes("waitForFree") &&
        type.includes("timePass"):
        return (
          <div className="flex h-[18px] rounded-[5px] overflow-hidden">
            {renderClockIcon()}
            {renderTimePass()}
          </div>
        );

      case Array.isArray(type) &&
        type.length === 2 &&
        type.includes("freeEpisodes") &&
        type.includes("timePass"):
        return (
          <div className="flex h-[18px] rounded-[5px] overflow-hidden">
            {renderFreeEpisodes()}
            {renderTimePass()}
          </div>
        );

      case Array.isArray(type) && type.length === 3:
        return (
          <div className="flex h-[18px] rounded-[5px] overflow-hidden">
            {renderClockIcon()}
            {renderFreeEpisodes()}
            {renderTimePass()}
          </div>
        );

      case type === "free":
        return (
          <div
            className={`${priceBadgeSizeClass} flex justify-center items-center bg-white border border-dark-gray-100 rounded-[5px]`}
          >
            <span
              className={`${priceBadgeTextSizeClass} text-dark-gray-500 font-medium`}
            >
              무료
            </span>
          </div>
        );

      case type === "paid":
        return (
          <div
            className={`${priceBadgeSizeClass} flex justify-center items-center bg-red-100 rounded-[5px]`}
          >
            <span
              className={`${priceBadgeTextSizeClass} text-white font-medium`}
            >
              유료
            </span>
          </div>
        );

      case type === "end":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] bg-dark-gray-400 rounded-[5px]">
            <span className="text-10pxr text-white font-medium">완결</span>
          </div>
        );

      case type === "rest":
        return (
          <div className="flex justify-center items-center w-[35px] h-[18px] bg-dark-gray-400 rounded-[5px]">
            <span className="text-10pxr text-white font-medium">휴재중</span>
          </div>
        );

      case type === "stop":
        return (
          <div className="flex justify-center items-center w-[42px] h-[18px] bg-dark-gray-400 rounded-[5px]">
            <span className="text-10pxr text-white font-medium">연재중지</span>
          </div>
        );

      case type === "new":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] bg-[#386FD9] rounded-[5px]">
            <span className="text-10pxr text-white font-medium">신작</span>
          </div>
        );

      case type === "CPContract":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] bg-[#05A1D3] rounded-[5px]">
            <span className="text-10pxr text-white font-medium">계약</span>
          </div>
        );

      case type === "only":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] bg-white border border-[#6269D3] rounded-[5px]">
            <span className="text-10pxr text-[#363EB4] font-medium">독점</span>
          </div>
        );

      case type === "reservation":
        return (
          <div className="flex justify-center items-center w-[24px] h-[18px] bg-[#FD6E06] rounded-[5px]">
            <span className="text-10pxr text-white font-medium">예약</span>
          </div>
        );

      case type === "rental":
        return (
          <div
            className={`${
              size === "large" ? "w-[30px] h-[20px]" : "w-[24px] h-[18px]"
            } flex justify-center items-center bg-[#6451B0] rounded-[5px]`}
          >
            <span
              className={`${
                size === "large" ? "text-12pxr" : "text-10pxr"
              } text-white font-medium`}
            >
              대여
            </span>
          </div>
        );

      case type === "collect":
        return (
          <div
            className={`${
              size === "large" ? "w-[30px] h-[20px]" : "w-[24px] h-[18px]"
            } flex justify-center items-center bg-[#23AE5A] rounded-[5px]`}
          >
            <span
              className={`${
                size === "large" ? "text-12pxr" : "text-10pxr"
              } text-white font-medium`}
            >
              소장
            </span>
          </div>
        );

      case type === "CP":
        return renderJob("CP");
      case type === "editor":
        return renderJob("편집");
      case type === "enter":
        return renderJob("엔터");
      case type === "author":
        return renderJob("작가");
      default:
        return null;
    }
  };

  return <>{badge()}</>;
};

export default SquareBadge;

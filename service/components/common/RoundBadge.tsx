interface BaseProps {
  size?: "small" | "large";
}

interface CustomBadgeProps extends BaseProps {
  type: "custom";
  color: string;
  text: string;
  textColor?: string;
  className?: string;
}

interface StandardBadgeProps extends BaseProps {
  type:
    | "reservation" //예약
    | "release" //공개
    | "private" //비공개
    | "author" //작가
    | "representative" //대표
    | "individual" //개인
    | "CP" //CP
    | "editor"; //편집자
  color?: string;
  text?: string;
  textColor?: string;
  className?: string;
}

type Props = CustomBadgeProps | StandardBadgeProps;
const RoundBadge = ({
  type,
  size = "small",
  color,
  text,
  textColor = "text-white",
  className,
}: Props) => {
  const badge = () => {
    switch (true) {
      case type === "reservation":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] border border-[#FD6E06] rounded-[100px]">
            <span className="text-10pxr text-[#FD6E06] font-medium">예약</span>
          </div>
        );
      case type === "release":
        return (
          <div className="flex justify-center items-center w-[27px] h-[18px] bg-[#23B4E4] rounded-[100px]">
            <span className="text-10pxr text-white font-medium">공개</span>
          </div>
        );
      case type === "private":
        return (
          <div className="flex justify-center items-center w-[35px] h-[18px] bg-dark-gray-500 rounded-[100px]">
            <span className="text-10pxr text-white font-medium">비공개</span>
          </div>
        );
      case type === "author":
        return (
          <div
            className={`${
              size === "large" ? "w-[42px] h-[26px]" : "w-[27px] h-[18px]"
            } flex justify-center items-center  bg-[#12ABDC] rounded-[100px]`}
          >
            <span
              className={`${
                size === "large" ? "text-14pxr" : "text-10pxr"
              } text-white font-medium`}
            >
              작가
            </span>
          </div>
        );
      case type === "representative":
        return (
          <div className="flex justify-center items-center w-[42px] h-[26px] bg-black-100 rounded-[100px]">
            <span className="text-14pxr text-white font-medium">대표</span>
          </div>
        );
      case type === "individual":
        return (
          <div className="flex justify-center items-center w-[42px] h-[26px] bg-[#386FD9] rounded-[100px]">
            <span className="text-14pxr text-white font-medium">개인</span>
          </div>
        );
      case type === "CP":
        return (
          <div className="flex justify-center items-center w-[42px] h-[26px] bg-[#8D42EC] rounded-[100px]">
            <span className="text-14pxr text-white font-medium">CP</span>
          </div>
        );
      case type === "editor":
        return (
          <div className="flex justify-center items-center w-[54px] h-[26px] bg-[#F87211] rounded-[100px]">
            <span className="text-14pxr text-white font-medium">편집자</span>
          </div>
        );
      case type === "custom":
        return (
          <div
            className={`flex justify-center items-center px-1 ${className} ${color} rounded-[100px]`}
          >
            <span
              className={`${
                size === "small" ? "text-10pxr" : "text-14pxr"
              } ${textColor} font-medium`}
            >
              {text}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return <>{badge()}</>;
};

export default RoundBadge;

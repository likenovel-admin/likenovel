import { IEvaluation, IReviewRating } from "@/types";
import Image from "next/image";

const emojis = [
  "/images/test/highly-positive.svg",
  "/images/test/very-positive.svg",
  "/images/test/positive.svg",
  "/images/test/some-what-positive.svg",
  "/images/test/neutral.svg",
  "/images/test/some-what-negative.svg",
  "/images/test/negative.svg",
  "/images/test/very-negative.svg",
  "/images/test/highly-negative.svg",
];

const messages = [
  "서둘러 연참해주세요",
  "내용이 신선해요",
  "국가권력급 필력이에요",
  "건필하세요",
  "그럭저럭 볼 만은 해요",
  "응원합니다",
  "유치해서 보기 힘들어요",
  "내용이 조금 지루해요",
  "다들 시간낭비하지 마세요",
];

const defaultEvaluations: IEvaluation = {
  "highly-positive": 0,
  "very-positive": 0,
  positive: 0,
  "some-what-positive": 0,
  neutral: 0,
  "some-what-negative": 0,
  negative: 0,
  "very-negative": 0,
  "highly-negative": 0,
};

interface Props {
  evaluations: Partial<IEvaluation>;
  emojiPosition?: "inside" | "outside";
}

const ProductReaction = ({ evaluations, emojiPosition = "inside" }: Props) => {
  const mergedEvaluations = { ...defaultEvaluations, ...evaluations };
  const ratings = Object?.entries(mergedEvaluations) as [
    IReviewRating,
    number
  ][];
  const maxCount = Math.max(...ratings.map(([, count]) => count));
  const getColorClass = (percentage: number) => {
    if (percentage >= 75) {
      return "bg-blue-400"; // 75% 이상
    } else if (percentage >= 50) {
      return "bg-blue-300"; // 50% 이상 75% 미만
    } else if (percentage >= 25) {
      return "bg-blue-200"; // 25% 이상 50% 미만
    } else {
      return "bg-blue-100"; // 25% 미만
    }
  };

  return (
    <div
      className={`flex flex-col gap-8pxr max-w-[741px] ${
        emojiPosition === "outside" ? "ml-[29px]" : ""
      }`}
    >
      {ratings?.map(([rating, count], index) => {
        const percentage = (count / maxCount) * 100;
        return (
          <div
            key={rating}
            className="w-full flex gap-6pxr items-center justify-between"
          >
            <Image
              src={emojis[index]}
              width={24}
              height={24}
              alt={rating}
              className={`${"left-[-29px] h-[24px] w-[24px]"}`}
            />
            <div className="flex items-center gap-12pxr w-full bg-light-gray-100 rounded-full">
              <div className="relative flex items-center w-full">
                <div
                  className={`${getColorClass(
                    percentage
                  )} h-[26px] rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />

                <span className={`absolute text-13pxr font-medium px-3`}>
                  {messages[index]}
                </span>
              </div>
              <span className="text-[#0079A0] text-12pxr font-semibold pr-3">
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductReaction;

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

export const EvaluationItems = [
  {
    value: "highlyPositive",
    image: "/images/test/highly-positive.svg",
    label: "서둘러 연참해주세요",
  },
  {
    value: "veryPositive",
    image: "/images/test/very-positive.svg",
    label: "내용이 신선해요",
  },
  {
    value: "positive",
    image: "/images/test/positive.svg",
    label: "국가권력급 필력이에요",
  },
  {
    value: "somewhatPositive",
    image: "/images/test/some-what-positive.svg",
    label: "건필하세요",
  },
  {
    value: "neutral",
    image: "/images/test/neutral.svg",
    label: "그럭저럭 볼 만은 해요",
  },
  {
    value: "somewhatNegative",
    image: "/images/test/some-what-negative.svg",
    label: "응원합니다",
  },
  {
    value: "negative",
    image: "/images/test/negative.svg",
    label: "유치해서 보기 힘들어요",
  },
  {
    value: "veryNegative",
    image: "/images/test/very-negative.svg",
    label: "내용이 조금 지루해요",
  },
  {
    value: "highlyNegative",
    image: "/images/test/highly-negative.svg",
    label: "다들 시간낭비하지 마세요",
  },
];

interface Props {
  onChange: (value: string) => void;
  selectedValue: string;
}

const ProductEvaluation = ({ onChange, selectedValue }: Props) => {
  return (
    <div className={`grid grid-cols-2 gap-2 w-full`}>
      {EvaluationItems.map((item, index) => (
        <ProductEvaluationItem
          item={item}
          key={item.value}
          isSelected={selectedValue === item.value}
          isFull={
            index === EvaluationItems.length - 1 &&
            EvaluationItems.length % 2 === 1
          }
          onClick={() => onChange(item.value)}
        />
      ))}
    </div>
  );
};

interface ProductEvaluationItemProps {
  item: (typeof EvaluationItems)[number];
  isSelected: boolean;
  isFull: boolean;
  onClick: () => void;
}
const ProductEvaluationItem = ({
  item,
  isSelected,
  isFull,
  onClick,
}: ProductEvaluationItemProps) => {
  return (
    <div
      key={item.value}
      className={`cursor-pointer flex items-center gap-3 px-2 py-4 rounded-xl justify-center ${
        isFull ? "col-span-2" : ""
      } ${
        isSelected
          ? "bg-[#0CA9DC] border-0 text-white"
          : "bg-light-gray-100 border"
      }`}
      onClick={onClick}
    >
      <Image src={item.image} alt={item.label} width={24} height={24} />
      <span className="text-12pxr md:text-16pxr">{item.label}</span>
    </div>
  );
};

export default ProductEvaluation;

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import Check from "/public/images/check.svg";

const EvaluationResult = ({ isOpen, onClose }: CommonModalProps) => {
  const { data } = useQuery({
    queryKey: ["selectSampleImages"],
    queryFn() {
      return [
        {
          id: 1,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 2,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 3,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 4,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 5,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 6,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 7,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 8,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 9,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 10,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 11,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 12,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 13,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 14,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 15,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 16,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 17,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 18,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 19,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 20,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 21,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 22,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 23,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 24,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 25,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 26,
          image: "/images/test/suggestion-cover.png",
        },
        {
          id: 27,
          image: "/images/test/suggestion-cover.png",
        },
      ];
    },
  });
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  return (
    <ModalContainer
      title="샘플이미지 선택"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <div className="flex flex-col items-center md:w-[560px]">
        <div className="grid grid-cols-4 overflow-y-auto md:grid-cols-6 gap-2 items-center p-4 md:p-8 w-full h-max">
          {data?.map((item) => (
            <SampleImageItem
              key={item.id}
              {...item}
              isSelected={selectedImage === item.id}
              onClick={() =>
                setSelectedImage((prev) => (prev === item.id ? null : item.id))
              }
            />
          ))}
        </div>
      </div>
      <div className="w-full mt-auto md:mt-4 sticky bottom-0 bg-white">
        <ModalBottomButton
          rightButton={{ text: "확인", onClick: onClose }}
          leftButton={{ text: "취소", onClick: onClose }}
        />
      </div>
    </ModalContainer>
  );
};

const SampleImageItem = ({
  id,
  image,
  isSelected,
  onClick,
}: {
  id: number;
  image: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <div>
      <button
        onClick={onClick}
        key={id}
        className={`w-full rounded-md overflow-hidden relative flex flex-col items-center justify-center`}
      >
        <Image
          src={image}
          alt="sample-image"
          width={100}
          height={100}
          className={`aspect-[240/362]  ${
            isSelected ? "filter brightness-50" : ""
          }`}
        />

        {isSelected && (
          <div
            className={`w-8 h-8 bg-primary-100 absolute rounded-full flex items-center justify-center`}
          >
            <Check className={`w-4 h-4 text-white`} />
          </div>
        )}
      </button>
    </div>
  );
};

export default EvaluationResult;

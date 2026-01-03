import Image from "next/image";
import RightArrowIcon from "/public/images/arrow-right-medium.svg";

import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Button from "../common/Button";
import Spinner from "../common/Spinner";

const ReviewList = () => {
  const router = useRouter();
  const { withAuth } = useAuthWrapper();
  // const { data, isLoading } = useSelectProductReview();
  const isLoading = false;
  const data: { data: any[] } = {
    data: [],
  };

  const reviews = useMemo(() => {
    if (!data?.data) return [];
    return data.data.slice(0, 3);
  }, [data]);
  if (isLoading) {
    return (
      <div className="flex flex-col w-full p-4">
        <div className="text-22px font-bold w-full mt-4">작품 리뷰</div>
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4">
      <div className="text-22px font-bold w-full mt-4">작품 리뷰</div>
      {reviews.length > 0 && (
        <div className="flex gap-4 border rounded-xl pl-3 mt-3 md:mt-4 md:pl-5 items-start">
          <Image
            src="/images/megaphone-gray.svg"
            alt="megaphone"
            width={22}
            height={18}
            className="mt-6"
          />
          <div className="flex flex-col gap-1 w-full">
            {reviews.map((review) => (
              <ReviewListItem
                key={review.id}
                id={review.id}
                title={review.review_text}
                date={getFormattingDate(review.created_date, "YYYY.MM.DD")}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 w-44 md:w-[276px] mx-auto">
        <Button
          variant="black"
          size="lg"
          className="w-full"
          onClick={withAuth(() => {
            router.push("/review/regist");
          })}
        >
          추천쓰기
        </Button>
      </div>
    </div>
  );
};

const ReviewListItem = ({
  title,
  date,
  id,
}: {
  title: string;
  date: string;
  id: number;
}) => {
  return (
    <div className="flex justify-between items-center border-b py-4 md:py-5 w-full last:border-b-0">
      <div>
        <div className="text-14pxr font-medium">{title}</div>
        <span className="text-12pxr font-normal text-gray-500">{date}</span>
      </div>
      <RightArrowIcon className="w-2 h-2 mr-4 text-gray-500" />
    </div>
  );
};
export default ReviewList;

"use client";

import { useSelectProductReviewDetail } from "@/app/api/query/product-review";
import Spinner from "@/components/common/Spinner";
import ReviewContent from "@/components/review/ReviewContent";
import ReviewProductSection from "@/components/review/ReviewProductSection";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useSelectProductReviewDetail(id);

  return (
    <div className="relative bg-white h-full max-w-[1120px] mx-auto flex flex-col items-center">
      <header className="flex justify-center items-center h-[60px] border-b relative w-full">
        작품 리뷰
        <button
          className="w-[18px] h-[18px] absolute right-3"
          onClick={() => router.push("/product/review")}
        >
          <Image src="/images/close.svg" alt="back" fill />
        </button>
      </header>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="w-full md:w-[880px] md:max-w-[880px]">
          <ReviewContent data={data?.data?.review} />
          <div className="w-full h-2 bg-light-gray-100 md:hidden"></div>
          <ReviewProductSection
            reviewId={data?.data?.review?.id}
            commentData={data?.data?.comments || []}
            product={data?.data?.product}
          />
        </div>
      )}
    </div>
  );
};

export default Page;

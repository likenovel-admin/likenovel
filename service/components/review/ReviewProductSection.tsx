import CommentList from "@/components/review/CommentList";
import ReviewCommentInput from "@/components/review/ReviewCommentInput";
import ReviewProduct from "@/components/review/ReviewProduct";
import { ICommentProductReview, IProduct } from "@/types";
import { useState } from "react";

interface ReviewProductSectionProps {
  product?: IProduct;
  reviewId?: number;
  commentData?: ICommentProductReview[];
}

const ReviewProductSection = ({
  product,
  reviewId,
  commentData,
}: ReviewProductSectionProps) => {
  const [activeTab, setActiveTab] = useState("recent");

  return (
    <>
      <ReviewProduct product={product} />
      <div className="w-full pt-8 pb-10 px-4 md:px-0">
        <ReviewCommentInput
          reviewId={reviewId}
          commentLength={commentData?.length || 0}
        />
        <div className="h-3"></div>
        <CommentList reviewId={reviewId || 0} commentData={commentData} />
      </div>
    </>
  );
};

export default ReviewProductSection;

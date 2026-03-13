import { useAddCommentProductReview } from "@/app/api/query/product-review";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useMediaDevice from "@/hooks/useMediaDevice";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Button from "../common/Button";
import Input from "../form/input";

interface IReviewCommentInputProps {
  reviewId?: number;
  commentLength?: number;
}

const ReviewCommentInput = ({
  reviewId,
  commentLength,
}: IReviewCommentInputProps) => {
  const media = useMediaDevice();
  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const addCommentEpisode = useAddCommentProductReview();
  const [comment, setComment] = useState("");

  const handleSubmitComment = withAuth(async () => {
    if (addCommentEpisode.isPending) return;
    if (!comment.trim()) return;

    if (!reviewId) {
      setToast({
        message: "에피소드 정보가 없습니다.",
        type: "error",
      });
      return;
    }

    try {
      await addCommentEpisode.mutateAsync({
        review_id: reviewId,
        body: {
          comment_text: comment.trim(),
        },
      });

      setComment("");
      setToast({
        message: "댓글이 등록되었습니다.",
        type: "success",
      });

      // Invalidate all queries that start with selectProductReviewDetail
      queryClient.invalidateQueries({
        queryKey: ["selectProductReviewDetail"],
      });
    } catch (error: any) {
      setToast({
        message: error?.response?.data?.message || "댓글 등록에 실패했습니다.",
        type: "error",
      });
    }
  });

  return (
    <Input
      value={comment}
      onChange={(event) => setComment(event.target.value)}
      inputStyle="w-full h-11 bg-light-gray-100 border-none md:h-[58px]"
      additionalText={
        <Button
          size={media === "mobile" ? "sm" : "lg"}
          className={`mr-2 ${
            !!comment ? "!bg-primary-100" : "!bg-gray-200 !text-gray-400"
          }`}
          disabled={!comment || addCommentEpisode.isPending}
          onClick={handleSubmitComment}
        >
          등록
        </Button>
      }
      label={`리뷰 댓글 ${commentLength || 0}`}
      labelStyle="mb-3 text-18pxr md:text-22pxr font-bold"
    />
  );
};

export default ReviewCommentInput;

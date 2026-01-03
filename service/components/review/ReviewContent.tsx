import {
  useBlockProductReview,
  useLikeProductReview,
  useReportProductReview,
  useUnLikeProductReview,
} from "@/app/api/query/product-review";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProductReview } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import SimpleMenu from "../common/SimpleMenu";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface ReviewContentProps {
  data?: IProductReview;
}

const ReviewContent = ({ data }: ReviewContentProps) => {
  const [like, setLike] = useState(data?.liked || false);
  const [likeCount, setLikeCount] = useState(data?.likesCount || 0);
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const { setTypeModal } = useModalStore();
  const queryClient = useQueryClient();
  const { withAuth } = useAuthWrapper();

  const likeProductReview = useLikeProductReview();
  const unLikeProductReview = useUnLikeProductReview();
  const blockProductReview = useBlockProductReview();
  const reportProductReview = useReportProductReview();

  if (!data) {
    return null;
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Handle like/unlike
  const handleLikeClick = withAuth(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (likeProductReview.isPending || unLikeProductReview.isPending) return;
      e.stopPropagation();

      if (!like) {
        // Like
        likeProductReview.mutate(data.id, {
        onSuccess: () => {
          setLike(true);
          setLikeCount((prev) => prev + 1);
          setToast({
            message: "좋아요를 눌렀습니다.",
            type: "success",
            isShowIcon: false,
          });
          // Refetch review detail data
          queryClient.invalidateQueries({
            queryKey: ["selectProductReviewDetail"],
          });
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message || "좋아요 변경에 실패했습니다.",
            type: "error",
          });
          console.error("Like error:", error);
        },
      });
    } else {
      // Unlike
      unLikeProductReview.mutate(data.id, {
        onSuccess: () => {
          setLike(false);
          setLikeCount((prev) => prev - 1);
          setToast({
            message: "좋아요를 취소했습니다.",
            type: "success",
            isShowIcon: false,
          });
          // Refetch review detail data
          queryClient.invalidateQueries({
            queryKey: ["selectProductReviewDetail"],
          });
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message || "좋아요 변경에 실패했습니다.",
            type: "error",
          });
          console.error("Unlike error:", error);
        },
      });
      }
    }
  );

  // Handle block review
  const handleBlockClick = () => {
    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            {data.reviewer.nickname}님의 <br /> 리뷰를 차단하시겠습니까?
          </span>
        </div>
      ),
      confirmText: "차단",
      onConfirm: () => {
        if (blockProductReview.isPending) return;
        blockProductReview.mutate(data.id, {
          onSuccess: () => {
            setToast({
              message: "리뷰가 차단되었습니다.",
              type: "success",
            });
            // Refetch review detail data
            queryClient.invalidateQueries({
              queryKey: ["selectProductReviewDetail"],
            });
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message || "리뷰 차단에 실패했습니다.",
              type: "error",
            });
            console.error("Block review error:", error);
          },
        });
      },
    });
  };

  const handleReportClick = () => {
    setTypeModal(TYPE_MODAL.REPORT_REASON, {
      onSubmit: (reason: string, detail: string) => {
        if (reportProductReview.isPending) return;
        reportProductReview.mutate(
          {
            review_id: data.id,
            body: { report_reason: reason, report_detail: detail },
          },
          {
            onSuccess: () => {
              setToast({
                message: "리뷰가 신고되었습니다.",
                type: "success",
              });
              // Refetch review detail data
              queryClient.invalidateQueries({
                queryKey: ["selectProductReviewDetail"],
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "리뷰 신고에 실패했습니다.",
                type: "error",
              });
              console.error("Block review error:", error);
            },
          }
        );
      },
    });
  };

  return (
    <>
      <div className="flex flex-col px-4 py-6 items-start justify-start w-full md:border rounded-3xl md:px-0 md:shadow-md md:mt-8">
        <div className="flex items-center w-full border-b pb-6 md:px-6">
          <div className="mr-3 relative rounded-full w-[30px] h-[30px] overflow-hidden">
            <Image
              src={
                data.reviewer.profileImagePath || "/images/profile-default.svg"
              }
              fill
              alt="프로필 사진"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-4">
              <UserNickname
                userNickname={data.reviewer.nickname}
                product={
                  {
                    badge: {
                      authorEventLevelBadgeImagePath:
                        data.reviewer.userEventLevelBadgeImagePath,
                    },
                  } as any
                }
              />
              <div className="flex gap-1">
                {data.reviewer.userRole === "CP" && <SquareBadge type={"CP"} />}
                {data.reviewer.userRole === "editor" && (
                  <SquareBadge type={"editor"} />
                )}
              </div>
            </div>
            <span className="text-12pxr text-dark-gray-400">
              {formatDate(data.createdDate)}
            </span>
          </div>
          <div className="ml-auto">
            <SimpleMenu
              menuList={[
                {
                  title: "신고",
                  onClick: handleReportClick,
                },
                {
                  title: "차단",
                  onClick: handleBlockClick,
                },
              ]}
            />
          </div>
        </div>
        <div className="w-full pt-6 md:px-6">
          {data.reviewTitle && (
            <div className="text-15pxr md:text-16pxr font-medium mb-4">
              <h1>{data.reviewTitle}</h1>
            </div>
          )}
          <div
            className="md:text-15pxr text-14pxr whitespace-pre-line break-words leading-[26px] overflow-wrap-anywhere"
            dangerouslySetInnerHTML={{ __html: data.reviewText }}
          />
        </div>
      </div>
      <div className="flex w-full">
        <button
          onClick={handleLikeClick}
          disabled={
            likeProductReview.isPending || unLikeProductReview.isPending
          }
          className="border w-[100px] h-[40px] md:w-[120px] md:h-[50px] rounded-full flex justify-center items-center gap-2 text-13pxr md:text-15pxr font-semibold my-7 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative w-[23px] h-[20px] md:w-[26px] md:h-[22px]">
            <Image
              src={like ? "/images/like-fill.svg" : "/images/like.svg"}
              alt="좋아요"
              fill
            />
          </div>
          {likeCount}
        </button>
      </div>
    </>
  );
};

export default ReviewContent;

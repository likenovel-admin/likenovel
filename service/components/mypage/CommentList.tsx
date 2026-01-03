import { useChangeComment, useDeleteComment } from "@/app/api/query/comment";
import {
  useDeleteCommentProductReview,
  useUpdateCommentProductReview,
} from "@/app/api/query/product-review";
import { IComment } from "@/components/common/CommentArea";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";
import SimpleMenu from "../common/SimpleMenu";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface ICommentListProps {
  comments?: IComment[];
}

const CommentList = ({ comments }: ICommentListProps) => {
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const queryClient = useQueryClient();
  const { mutateAsync: changeComment } = useChangeComment(false);
  const { mutateAsync: deleteComment } = useDeleteComment();
  const { mutateAsync: updateReviewComment } = useUpdateCommentProductReview();
  const { mutateAsync: deleteReviewComment } = useDeleteCommentProductReview();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();

  const handleEditClick = (commentId: number, currentContent: string) => {
    setIsEditing(commentId);
    setEditContent(currentContent);
  };

  const handleEditDoneClick = async (
    commentId: number,
    commentType?: "episode" | "review"
  ) => {
    try {
      if (commentType === "review") {
        await updateReviewComment(
          {
            comment_id: commentId,
            body: { comment_text: editContent },
          },
          {
            onSuccess: () => {
              setIsEditing(null);
              // Invalidate all comment-related queries to sync across tabs
              queryClient.invalidateQueries({
                queryKey: ["selectUserComments"],
              });
              setToast({
                message: "댓글이 수정되었습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "댓글 수정에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      } else {
        await changeComment(
          { productId: 0, commentId, content: editContent },
          {
            onSuccess: () => {
              setIsEditing(null);
              queryClient.invalidateQueries({
                queryKey: ["selectUserComments"],
              });
              setToast({
                message: "댓글이 수정되었습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "댓글 수정에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      }
    } catch (error) {
      setToast({
        message: "댓글 수정에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(event.target.value);
  };

  const handleDeleteClick = (
    commentId: number,
    commentType?: "episode" | "review"
  ) => {
    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            댓글을 삭제하시겠습니까?
          </span>
          <span className="text-10pxr md:text-14pxr text-center text-dark-gray-500">
            삭제한 댓글은 복구할 수 없습니다.
          </span>
        </div>
      ),
      onConfirm: async () => {
        try {
          if (commentType === "review") {
            await deleteReviewComment(commentId, {
              onSuccess: () => {
                // Invalidate all comment-related queries to sync across tabs
                queryClient.invalidateQueries({
                  queryKey: ["selectUserComments"],
                });
                setToast({
                  message: "댓글이 삭제되었습니다.",
                  type: "success",
                });
              },
              onError: (error: any) => {
                setToast({
                  message:
                    error?.response?.data?.message ||
                    "댓글 삭제에 실패했습니다.",
                  type: "error",
                });
              },
            });
          } else {
            await deleteComment(commentId, {
              onSuccess: () => {
                // Invalidate all comment-related queries to sync across tabs
                queryClient.invalidateQueries({
                  queryKey: ["selectUserComments"],
                });
                queryClient.invalidateQueries({ queryKey: ["selectComment"] });
                queryClient.invalidateQueries({
                  queryKey: ["selectCommentByEpisode"],
                });
                setToast({
                  message: "댓글이 삭제되었습니다.",
                  type: "success",
                });
              },
              onError: (error: any) => {
                setToast({
                  message:
                    error?.response?.data?.message ||
                    "댓글 삭제에 실패했습니다.",
                  type: "error",
                });
              },
            });
          }
        } catch (error) {
          setToast({
            message: "댓글 삭제에 실패했습니다.",
            type: "error",
          });
        }
      },
      confirmText: "삭제",
    });
  };

  return (
    <div className="pt-6 mt-6 border-t">
      {comments && comments.length > 0 ? (
        comments.map((comment) => (
          <CommentItem
            {...comment}
            key={comment.commentId}
            isEditing={isEditing === comment.commentId}
            onEditClick={() =>
              handleEditClick(comment.commentId, comment.content)
            }
            onEditDoneClick={() =>
              handleEditDoneClick(comment.commentId, comment.commentType)
            }
            onEditCancel={() => setIsEditing(null)}
            onDeleteClick={() =>
              handleDeleteClick(comment.commentId, comment.commentType)
            }
            editContent={editContent}
            onInputChange={handleInputChange}
          />
        ))
      ) : (
        <div className="text-center py-20 text-dark-gray-400">
          댓글이 없습니다.
        </div>
      )}
    </div>
  );
};

export default CommentList;

interface CommentItemProps extends IComment {
  isEditing: boolean;
  onEditClick: () => void;
  onEditDoneClick: () => void;
  onEditCancel: () => void;
  onDeleteClick: () => void;
  editContent: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const CommentItem = ({
  isEditing,
  onEditClick,
  onEditDoneClick,
  onEditCancel,
  onDeleteClick,
  editContent,
  onInputChange,
  ...comment
}: CommentItemProps) => {
  return (
    <div className="flex flex-col">
      <div className="relative flex items-start gap-16pxr">
        <Image
          src={comment.userProfileImagePath}
          alt="프로필"
          width={30}
          height={30}
          className="w-[30px] h-[30px] rounded-full mt-[7px]"
        />
        <div className="flex flex-col w-full">
          <div className="flex justify-between w-full">
            <div className="flex gap-5pxr">
              <div className="flex items-center gap-5pxr">
                <UserNickname
                  userNickname={comment.userNickname}
                  product={
                    {
                      badge: {
                        authorEventLevelBadgeImagePath:
                          comment.userEventLevelBadgeImagePath,
                      },
                    } as any
                  }
                />
              </div>
              <div className="flex items-center">
                {comment.userRole !== "user" && comment.userRole && (
                  <SquareBadge
                    type={
                      comment.userRole as "author" | "CP" | "editor" | "enter"
                    }
                  />
                )}
              </div>
            </div>
            <SimpleMenu
              menuList={[
                {
                  onClick: onEditClick,
                  title: "수정",
                },
                {
                  onClick: onDeleteClick,
                  title: "삭제",
                },
              ]}
            />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-[5px]">
              <textarea
                className="w-[80%] text-14pxr border border-light-gray-300 rounded-[8px] resize-none p-2"
                value={editContent}
                onChange={onInputChange}
              />
              <button
                className="bg-primary-100 px-[7px] h-[30px] text-12pxr text-white rounded-[5px] hover:bg-primary-200"
                onClick={onEditDoneClick}
              >
                수정
              </button>
              <button
                className="bg-dark-gray-100 px-[7px] h-[30px] text-12pxr text-white rounded-[5px] hover:bg-dark-gray-200"
                onClick={onEditCancel}
              >
                취소
              </button>
            </div>
          ) : (
            <span className="w-[90%] text-14pxr">{comment.content}</span>
          )}
          <span className="text-13pxr text-dark-gray-400 mt-7pxr">
            <span className="font-medium">{comment.productTitle}</span> <br />
            {comment.commentType === "review" && comment.reviewTitle
              ? `댓글 리뷰 : ${comment.reviewTitle}`
              : comment.commentEpisode
              ? comment.commentEpisode.replace(
                  /^댓글 회차 : \d+화\.\s*/,
                  "댓글 회차 : "
                )
              : ""}
          </span>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-14pxr">
              <span className="text-12pxr text-dark-gray-400 mt-11pxr">
                {dayjs(comment.postingDate).format("YYYY.MM.DD")}
              </span>
            </div>
            <div className="flex gap-15pxr md:gap-26pxr items-end">
              <div className="flex gap-4pxr md:gap-8pxr">
                <button className="flex justify-center gap-5pxr items-center w-[50px] md:w-[60px] h-[25px] md:h-[30px] bg-light-gray-100 rounded-[10px] hover:bg-light-gray-300">
                  <Image
                    src={"/images/thumbs-up.svg"}
                    alt="추천"
                    width={16}
                    height={18}
                    className="w-[16px] md:w-[18px] h-[15px]"
                  />

                  <span className="text-13pxr text-dark-gray-400">
                    {comment.recommendCount}
                  </span>
                </button>
                <button className="flex justify-center gap-5pxr items-center w-[50px] md:w-[60px] h-[25px] md:h-[30px] bg-light-gray-100 rounded-[10px] hover:bg-light-gray-300">
                  <Image
                    src={"/images/thumbs-down.svg"}
                    alt="추천"
                    width={16}
                    height={16}
                    className="w-[16px] md:w-[18px] h-[15px]"
                  />
                  <span className="text-13pxr text-dark-gray-400">
                    {comment.notRecommendCount}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border border-t-light-gray-300 border-b-0 border-l-0 border-r-0 mt-25pxr mb-20pxr" />
    </div>
  );
};

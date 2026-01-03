import {
  useBlockCommentProductReview,
  useDeleteCommentProductReview,
  useReportCommentProductReview,
  useUpdateCommentProductReview,
} from "@/app/api/query/product-review";
import SquareBadge from "@/components/common/SquareBadge";
import Tab from "@/components/common/Tab";
import { TYPE_MODAL } from "@/constants/common";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { ICommentProductReview } from "@/types";
import { getUser } from "@/utils/getUser";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Another from "/public/images/another.svg";

interface Props {
  reviewId?: number;
  commentData?: ICommentProductReview[];
}

const CommentList = ({ reviewId, commentData }: Props) => {
  const user = getUser();
  const currentUserId = user?.userId;
  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const { setTypeModal } = useModalStore();

  const { mutateAsync: changeComment } = useUpdateCommentProductReview();
  const { mutateAsync: deleteComment } = useDeleteCommentProductReview();
  const reportCommentProductReview = useReportCommentProductReview();
  const { mutateAsync: blockComment } = useBlockCommentProductReview();
  const queryClient = useQueryClient();

  const [localActiveTab, setLocalActiveTab] = useState("latest");

  const [expandedCommentIndex, setExpandedCommentIndex] = useState<
    number | null
  >(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  // For episode pageType, use passed commentData (no additional API call needed)
  const comments = commentData || [];
  const refetch = () => {
    queryClient.invalidateQueries({
      queryKey: ["selectProductReviewDetail"],
    });
  };

  const handleEditDoneClick = withAuth(async (commentId: number) => {
    try {
      await changeComment({
        comment_id: commentId,
        body: { comment_text: editContent },
      });
      setIsEditing(null);
      refetch();
      setToast({
        message: "댓글이 수정되었습니다.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "댓글 수정에 실패했습니다.",
        type: "error",
      });
    }
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(event.target.value);
  };

  const handleEditClick = withAuth((commentId: number) => {
    setIsEditing(commentId);
  });

  const handleTabChange = (value: string) => {
    setLocalActiveTab(value);
  };
  const toggleExpand = (index: number) => {
    setExpandedCommentIndex(expandedCommentIndex === index ? null : index);
  };
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setExpandedCommentIndex(null);
    }
  };

  const handleOpenConfirm = (
    e: React.MouseEvent,
    commentId: number,
    confirmType: "delete" | "block",
    userNickname?: string
  ) => {
    e.stopPropagation();
    const handleDeleteConfirm = withAuth(async () => {
      try {
        await deleteComment(commentId);
        refetch();
        setToast({
          message: "댓글이 삭제되었습니다.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: "댓글 삭제에 실패했습니다.",
          type: "error",
        });
      }
    });

    const handleBlockConfirm = withAuth(async () => {
      try {
        await blockComment(commentId);
        refetch();
        setToast({
          message: "댓글이 차단되었습니다.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: "댓글 차단에 실패했습니다.",
          type: "error",
        });
      }
    });

    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          {confirmType === "delete" ? (
            <>
              <span className="text-15pxr md:text-18pxr font-bold text-center">
                댓글을 삭제하시겠습니까?
              </span>
              <span className="text-10pxr md:text-14pxr text-center text-dark-gray-500">
                삭제한 댓글은 복구할 수 없습니다.
              </span>
            </>
          ) : (
            <span className="text-15pxr md:text-18pxr font-bold text-center">
              {userNickname}님의 <br /> 댓글을 차단하시겠습니까?
            </span>
          )}
        </div>
      ),
      onConfirm: () =>
        confirmType === "delete" ? handleDeleteConfirm() : handleBlockConfirm(),
      confirmText: confirmType === "delete" ? "삭제" : "차단",
    });
  };

  const handleOpenReportModal = withAuth(
    (e: React.MouseEvent, commentId: number) => {
      e.stopPropagation();
      setTypeModal(TYPE_MODAL.REPORT_REASON, {
        onSubmit: (reason: string, detail: string) => {
          if (reportCommentProductReview.isPending) return;
          reportCommentProductReview.mutate(
            {
              comment_id: commentId || 0,
              body: { report_reason: reason, report_detail: detail },
            },
            {
              onSuccess: () => {
                setToast({
                  message: "리뷰가 신고되었습니다.",
                  type: "success",
                });
                // Refetch review detail data
                refetch();
              },
              onError: (error: any) => {
                setToast({
                  message:
                    error?.response?.data?.message ||
                    "리뷰 신고에 실패했습니다.",
                  type: "error",
                });
                console.error("Block review error:", error);
              },
            }
          );
        },
      });
    }
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col mt-[30px]">
      <Tab
        tabs={[
          { label: "최신순", value: "recent" },
          { label: "공감 많은순", value: "recommend" },
        ]}
        style="check"
        activeTab={localActiveTab}
        onTabChange={handleTabChange}
      />
      <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-13pxr mb-27pxr" />
      {comments.length < 1 ? (
        <div className="flex justify-center">
          <span className="text-14pxr text-dark-gray-400">
            작품에 달린 댓글이 없습니다.
          </span>
        </div>
      ) : (
        <>
          {comments.map((comment, index) => {
            return (
              <div className="flex flex-col" key={comment.id}>
                <div className="relative flex items-start gap-16pxr">
                  <Image
                    src={comment.commenter.profileImagePath}
                    alt="프로필"
                    width={30}
                    height={30}
                    className="w-[30px] h-[30px] rounded-full mt-[7px]"
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between w-full">
                      <div className="flex items-center gap-5pxr">
                        <div className="flex items-center gap-5pxr">
                          <span className="text-14pxr font-semibold">
                            {comment.commenter.nickname}
                          </span>
                          <Image
                            src={comment.commenter.userEventLevelBadgeImagePath}
                            alt="레벨"
                            width={12}
                            height={14}
                            className="w-[12px] h-[15px]"
                          />
                        </div>
                        <div className="flex items-center">
                          {comment.commenter.userRole !== "user" &&
                            comment.commenter.userRole && (
                              <SquareBadge
                                type={
                                  comment.commenter.userRole as
                                    | "author"
                                    | "CP"
                                    | "editor"
                                    | "enter"
                                }
                              />
                            )}
                        </div>
                      </div>
                      <button
                        className="p-2 text-dark-gray-100 hover:text-dark-gray-500"
                        onClick={() => toggleExpand(index)}
                      >
                        <Another className="w-[3px] h-[15px]" />
                      </button>
                    </div>
                    {isEditing === comment.id ? (
                      <div className="flex items-center gap-[5px]">
                        <textarea
                          className="w-[80%] text-14pxr border border-light-gray-300 rounded-[8px] resize-none p-2"
                          defaultValue={comment.commentText}
                          onChange={handleInputChange}
                        />
                        <button
                          className="bg-primary-100 px-[7px] h-[30px] text-12pxr text-white rounded-[5px] hover:bg-primary-200"
                          onClick={() => handleEditDoneClick(comment.id)}
                        >
                          수정
                        </button>
                        <button
                          className="bg-dark-gray-100 px-[7px] h-[30px] text-12pxr text-white rounded-[5px] hover:bg-dark-gray-200"
                          onClick={() => setIsEditing(null)}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span className="w-[90%] text-14pxr">
                        {comment.commentText}
                      </span>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-14pxr">
                        <span className="text-12pxr text-dark-gray-400 mt-11pxr">
                          {dayjs(comment.createdDate).format("YYYY.MM.DD")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedCommentIndex === index && (
                    <div
                      ref={menuRef}
                      className="absolute right-[10px] top-[30px] flex flex-col bg-white border border-light-gray-500 rounded-[8px] z-10"
                    >
                      {comment.userId === currentUserId ? (
                        <>
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={() => {
                              handleEditClick(comment.id);
                              setExpandedCommentIndex(null);
                            }}
                          >
                            수정
                          </button>
                          <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={(e) => {
                              handleOpenConfirm(e, comment.id, "delete");
                              setExpandedCommentIndex(null);
                            }}
                          >
                            삭제
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={(e) => {
                              handleOpenReportModal(e, comment.id);
                              setExpandedCommentIndex(null);
                            }}
                          >
                            신고
                          </button>
                          <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={(e) => {
                              handleOpenConfirm(
                                e,
                                comment.id,
                                "block",
                                comment.commenter.nickname
                              );
                              setExpandedCommentIndex(null);
                            }}
                          >
                            차단
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-full border border-t-light-gray-300 border-b-0 border-l-0 border-r-0 mt-25pxr mb-20pxr" />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
export default CommentList;

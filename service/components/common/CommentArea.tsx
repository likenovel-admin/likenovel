import {
  useBlockComment,
  useChangeComment,
  useDeleteComment,
  useNotRecommendComment,
  useRecommendComment,
  useReportComment,
  useSelectComment,
} from "@/app/api/query/comment";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IRole } from "@/types";
import dayjs from "dayjs";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import ReportModal from "../modal/ReportModal";
import Modal from "./Modal";
import MoreReadButton from "./MoreReadButton";
import SquareBadge from "./SquareBadge";
import Tab from "./Tab";
import Another from "/public/images/another.svg";
import Heart from "/public/images/heart.svg";
import Pin from "/public/images/pin.svg";
import ThumbsDownGray from "/public/images/thumbs-down-gray.svg";
import ThumbsUpBlue from "/public/images/thumbs-up-blue.svg";

export interface IComment {
  commentId: number;
  userId: number;
  userNickname: string;
  userProfileImagePath: string;
  userInterestLevelBadgeImagePath: string;
  userEventLevelBadgeImagePath: string;
  authorPinnedTopYn: "Y" | "N";
  authorNickName: string;
  authorNickname: string;
  authorProfileBadgeImagePath: string;
  authorRecommendedYn: "Y" | "N";
  content: string;
  postingDate: string;
  commentEpisode?: string;
  commentType?: "episode" | "review";
  reviewTitle?: string;
  recommendCount: number;
  notRecommendCount: number;
  userRole: IRole;
  recommendYn: "Y" | "N";
  notRecommendYn: "Y" | "N";
  publishDate: string; // ISO datetime string, e.g. "2025-09-26T07:58:26"
  productTitle: string;
}
interface Props {
  pageType: "product" | "episode" | "author";
  productId: number;
  hasEpisode?: boolean;
  hasAuthorFixedComment?: boolean;
  keepPreviousData?: boolean;
}

const PAGE_SIZE = 6;

const CommentArea = ({
  pageType,
  productId,
  hasEpisode,
  hasAuthorFixedComment,
  keepPreviousData,
}: Props) => {
  const { user } = useAuthStore();
  const currentUserId = user?.userId;
  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const { setModal } = useModalStore();

  const { mutateAsync: changeComment } = useChangeComment();
  const { mutateAsync: deleteComment } = useDeleteComment();
  const { mutateAsync: reportComment } = useReportComment();
  const { mutateAsync: blockComment } = useBlockComment();
  const { mutateAsync: recommendComment } = useRecommendComment();
  const { mutateAsync: notRecommendComment } = useNotRecommendComment();

  const [activeTab, setActiveTab] = useState("recommend");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [expandedCommentIndex, setExpandedCommentIndex] = useState<
    number | null
  >(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "normal" | null>(null);
  const [thumbsReactions, setThumbsReactions] = useState<{
    [key: number]: "up" | "down" | null;
  }>({});
  const [isToggleRecommend, setIsToggleRecommend] = useState<{
    [key: number]: boolean;
  }>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const prevUserIdRef = useRef<number | undefined>(user?.userId);

  const {
    data: comments,
    fetchNextPage,
    refetch,
  } = useSelectComment(
    Number(productId),
    1,
    PAGE_SIZE,
    activeTab,
    keepPreviousData
  );

  const allComments: IComment[] = useMemo(() => {
    if (comments) {
      const newComments = comments.pages
        .map((page) => page.data.comments)
        .flat();

      // Sort pinned comments to top
      const sorted = [...newComments].sort((a, b) => {
        if (a.authorPinnedTopYn === "Y" && b.authorPinnedTopYn !== "Y")
          return -1;
        if (a.authorPinnedTopYn !== "Y" && b.authorPinnedTopYn === "Y")
          return 1;
        return 0;
      });

      return sorted;
    }
    return [];
  }, [comments]);

  const [visibleComments, setVisibleComments] =
    useState<IComment[]>(allComments);

  useEffect(() => {
    setVisibleComments(allComments);
  }, [allComments]);

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const handleEditDoneClick = async (commentId: number) => {
    await changeComment({ productId, commentId, content: editContent });
    setIsEditing(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(event.target.value);
  };

  const handleEditClick = (commentId: number) => {
    setIsEditing(commentId);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const toggleExpand = (index: number) => {
    setExpandedCommentIndex(expandedCommentIndex === index ? null : index);
  };
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setExpandedCommentIndex(null);
    }
  };

  const handleThumbsClick = async (commentId: number, type: "up" | "down") => {
    const currentReaction = thumbsReactions[commentId];
    const isUndo = currentReaction === type;

    setThumbsReactions((prev) => ({
      ...prev,
      [commentId]: isUndo ? null : type,
    }));

    const updatedComments = allComments.map((comment) => {
      if (comment.commentId !== commentId) return comment;

      let newRecommendCount = comment.recommendCount;
      let newNotRecommendCount = comment.notRecommendCount;

      // 추천 (recommendCount) 업데이트
      if (type === "up") {
        if (isUndo) {
          newRecommendCount = comment.recommendCount; // 추천을 다시 눌렀을 때, 기존 추천수로 복귀
        } else {
          // 추천 상태 확인 후 업데이트
          if (comment.recommendYn === "Y") {
            // 비추천을 했다가 다시 추천을 누른 경우
            if (isToggleRecommend[commentId]) {
              newRecommendCount = comment.recommendCount; // 기존값 복귀
              // 상태 원복
              setIsToggleRecommend((prev) => ({
                ...prev,
                [commentId]: false,
              }));
            } else {
              newRecommendCount = comment.recommendCount - 1; // 이미 추천한 경우 취소
            }
          } else {
            newRecommendCount = comment.recommendCount + 1; // 처음 추천한 경우
          }
        }
      } else if (type === "down") {
        // 비추천 상태에서 추천 업데이트
        if (comment.recommendYn === "Y") {
          setIsToggleRecommend((prev) => ({
            ...prev,
            [commentId]: true,
          }));
          newRecommendCount = comment.recommendCount - 1; // 추천을 취소
        }
      }

      // 비추천 (notRecommendCount) 업데이트
      if (type === "down") {
        if (isUndo) {
          newNotRecommendCount = comment.notRecommendCount; // 비추천을 다시 눌렀을 때, 기존 비추천수로 복귀
        } else {
          // 비추천 상태 확인 후 업데이트
          if (comment.notRecommendYn === "Y") {
            // 추천을 했다가 다시 비추천을 누른 경우
            if (isToggleRecommend[commentId]) {
              newNotRecommendCount = comment.notRecommendCount; // 기존값 복귀
              // 상태 원복
              setIsToggleRecommend((prev) => ({
                ...prev,
                [commentId]: false,
              }));
            } else {
              newNotRecommendCount = comment.notRecommendCount - 1; // 이미 비추천한 경우 취소
            }
          } else {
            newNotRecommendCount = comment.notRecommendCount + 1; // 처음 비추천한 경우
          }
        }
      } else if (type === "up") {
        // 추천 상태에서 비추천 업데이트
        if (comment.notRecommendYn === "Y") {
          setIsToggleRecommend((prev) => ({
            ...prev,
            [commentId]: true,
          }));
          newNotRecommendCount = comment.notRecommendCount - 1; // 비추천을 취소
        }
      }

      return {
        ...comment,
        recommendCount: newRecommendCount,
        notRecommendCount: newNotRecommendCount,
      };
    });

    setVisibleComments(updatedComments);

    try {
      if (type === "up") {
        await recommendComment(commentId);
      } else {
        await notRecommendComment(commentId);
      }
    } catch (error) {
      setToast({
        message: "추천 변경에 실패했습니다.",
        type: "error",
      });

      setVisibleComments(allComments);
      setThumbsReactions((prev) => ({
        ...prev,
        [commentId]: currentReaction,
      }));
    }
  };

  const handleOpenConfirm = (
    e: React.MouseEvent,
    commentId: number,
    confirmType: "delete" | "block",
    userNickname?: string
  ) => {
    e.stopPropagation();
    const handleDeleteConfirm = async () => {
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
    };

    const handleBlockConfirm = async () => {
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
    };

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

  const handleOpenReportModal = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    const handleConfirm = async (
      selectedValue: string,
      reportContent: string
    ) => {
      try {
        await reportComment({
          commentId,
          reportType: selectedValue,
          content: reportContent,
        });
        refetch();
        setToast({
          message: "댓글 신고가 완료되었습니다.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: "댓글 신고에 실패했습니다.",
          type: "error",
        });
      }
    };

    setModal(
      <ReportModal
        reportType="comment"
        reportOptions={[
          { value: "option1", label: "신고내용1" },
          { value: "option2", label: "신고내용2" },
          { value: "option3", label: "신고내용3" },
        ]}
        onConfirm={handleConfirm}
      />
    );
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (comments) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  }, [comments]);

  console.log("visibleComments:", visibleComments);

  return (
    <div className="relative flex flex-col">
      <Tab
        tabs={[
          { label: "공감 많은순", value: "recommend" },
          { label: "최신순", value: "recent" },
        ]}
        style="check"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-13pxr mb-27pxr" />
      {visibleComments.length < 1 ? (
        <div className="flex justify-center">
          <span className="text-14pxr text-dark-gray-400">
            작품에 달린 댓글이 없습니다.
          </span>
        </div>
      ) : (
        <>
          {visibleComments.slice(0, visibleCount).map((comment, index) => {
            return (
              <div className="flex flex-col" key={comment.commentId}>
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
                          <span className="text-14pxr font-semibold">
                            {comment.userNickname}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {comment.userRole !== "user" && comment.userRole && (
                            <SquareBadge
                              type={
                                comment.userRole as
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
                    {isEditing === comment.commentId ? (
                      <div className="flex items-center gap-[5px]">
                        <textarea
                          className="w-[80%] text-14pxr border border-light-gray-300 rounded-[8px] resize-none p-2"
                          defaultValue={comment.content}
                          onChange={handleInputChange}
                        />
                        <button
                          className="bg-primary-100 px-[7px] h-[30px] text-12pxr text-white rounded-[5px] hover:bg-primary-200"
                          onClick={() => handleEditDoneClick(comment.commentId)}
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
                        {comment.content}
                      </span>
                    )}
                    {hasEpisode && (
                      <span className="text-13pxr text-dark-gray-400 mt-7pxr">
                        {comment.commentEpisode}
                      </span>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-14pxr">
                        <span className="text-12pxr text-dark-gray-400 mt-11pxr">
                          {dayjs(comment.postingDate).format("YYYY.MM.DD")}
                        </span>
                        {hasAuthorFixedComment &&
                          comment.authorPinnedTopYn === "Y" && (
                            <div className="flex items-center h-[20px] px-9pxr gap-3pxr bg-dark-gray-500 rounded-full mt-[10px]">
                              <Pin />
                              <span className="text-8pxr md:text-12pxr text-white">
                                {comment.authorNickName ||
                                  comment.authorNickname}{" "}
                                님이 고정함
                              </span>
                            </div>
                          )}
                      </div>
                      <div className="flex gap-15pxr md:gap-26pxr items-end">
                        {comment.authorRecommendedYn === "Y" && (
                          <div className="relative">
                            <Image
                              src={"/images/test/user_img01.png"}
                              alt="작가 추천"
                              width={30}
                              height={30}
                              className="min-w-[30px] h-[30px] rounded-full"
                            />
                            <Heart className="absolute top-0 right-[-8px]" />
                          </div>
                        )}
                        <div className="flex gap-4pxr md:gap-8pxr">
                          <button
                            className="flex justify-center gap-5pxr items-center w-[50px] md:w-[60px] h-[25px] md:h-[30px] bg-light-gray-100 rounded-[10px] hover:bg-light-gray-300"
                            onClick={() =>
                              handleThumbsClick(comment.commentId, "up")
                            }
                          >
                            {comment.recommendYn === "Y" ||
                            thumbsReactions[comment.commentId] === "up" ? (
                              <ThumbsUpBlue className="w-[16px] md:w-[18px] h-[15px]" />
                            ) : (
                              <Image
                                src={"/images/thumbs-up.svg"}
                                alt="추천"
                                width={16}
                                height={18}
                                className="w-[16px] md:w-[18px] h-[15px]"
                              />
                            )}

                            <span className="text-13pxr text-dark-gray-400">
                              {comment.recommendCount}
                            </span>
                          </button>
                          <button
                            className="flex justify-center gap-5pxr items-center w-[50px] md:w-[60px] h-[25px] md:h-[30px] bg-light-gray-100 rounded-[10px] hover:bg-light-gray-300"
                            onClick={() =>
                              handleThumbsClick(comment.commentId, "down")
                            }
                          >
                            {comment.notRecommendYn === "Y" ||
                            thumbsReactions[comment.commentId] === "down" ? (
                              <ThumbsDownGray className="w-[16px] md:w-[18px] h-[15px]" />
                            ) : (
                              <Image
                                src={"/images/thumbs-down.svg"}
                                alt="추천"
                                width={16}
                                height={16}
                                className="w-[16px] md:w-[18px] h-[15px]"
                              />
                            )}
                            <span className="text-13pxr text-dark-gray-400">
                              {comment.notRecommendCount}
                            </span>
                          </button>
                        </div>
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
                              handleEditClick(comment.commentId);
                              setExpandedCommentIndex(null);
                            }}
                          >
                            수정
                          </button>
                          <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={(e) => {
                              handleOpenConfirm(e, comment.commentId, "delete");
                              setModalType("confirm");
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
                              withAuth(() => {
                                setModalType("normal");
                                handleOpenReportModal(e, comment.commentId);
                                setExpandedCommentIndex(null);
                              })();
                            }}
                          >
                            신고
                          </button>
                          <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
                          <button
                            className="text-14pxr px-[20px] py-[10px] hover:bg-light-gray-100"
                            onClick={(e) => {
                              withAuth(() => {
                                handleOpenConfirm(
                                  e,
                                  comment.commentId,
                                  "block",
                                  comment.userNickname
                                );
                                setModalType("confirm");
                                setExpandedCommentIndex(null);
                              })();
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
          {visibleCount < (comments?.pages[0].data.commentTotalCount ?? 0) && (
            <div className="absolute bottom-[20px] w-full flex items-end h-[150px] bg-gradient-to-t from-white to-transparent">
              <MoreReadButton onClick={handleLoadMore} />
            </div>
          )}
        </>
      )}
      {pageType !== "author" && (
        <Modal size="sm" hasCloseButton={modalType === "normal"} />
      )}
    </div>
  );
};
export default CommentArea;

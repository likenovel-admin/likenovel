import { useSelectCommentByEpisode } from "@/app/api/query/comment";
import { useAddCommentEpisode } from "@/app/api/query/episode";
import {
  QUICK_COMMENT_CHIP_CLASS,
  QUICK_COMMENT_CHIP_DARK_CLASS,
  QUICK_COMMENT_CHIPS,
} from "@/components/viewer/quickComments";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useToastStore from "@/store/toastStore";
import useViewStore from "@/store/viewerStore";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SendComment from "/public/images/icon_chat_send_btn.svg";

const LAST_PAGE_COMMENT_PREVIEW_COUNT = 3;

interface ReviewCardProps {
  productId?: number;
  episodeId?: number;
  commentOpenYn?: "Y" | "N";
  handleCommentState: (prefillContent?: string) => void;
}
export default function ReviewCard({
  productId,
  episodeId,
  commentOpenYn = "Y",
  handleCommentState,
}: ReviewCardProps) {
  const queryClient = useQueryClient();
  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  const isDarkTheme = settings.theme === "dark";
  const addCommentEpisode = useAddCommentEpisode();
  const [comment, setComment] = useState("");
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);
  const chipScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollChipsLeft, setCanScrollChipsLeft] = useState(false);
  const [canScrollChipsRight, setCanScrollChipsRight] = useState(false);
  const { data: commentData } = useSelectCommentByEpisode(
    productId || 0,
    episodeId || 0,
    1,
    10,
    "recent"
  );
  const commentTotalCount =
    commentData?.pages?.[0]?.data?.commentTotalCount || 0;
  const previewComments = (
    commentData?.pages?.[0]?.data?.comments || []
  ).slice(0, LAST_PAGE_COMMENT_PREVIEW_COUNT);
  const isCommentOpen = commentOpenYn !== "N";
  const canSubmit =
    isCommentOpen && !!comment.trim() && !addCommentEpisode.isPending;

  const handleSubmitComment = withAuth(async () => {
    if (!isCommentOpen) return;
    const content = comment.trim();
    if (!content || !episodeId || submittingRef.current) return;
    submittingRef.current = true;

    try {
      await addCommentEpisode.mutateAsync({
        episodeId,
        body: { content },
      });
      setComment("");
      queryClient.invalidateQueries({
        queryKey: ["selectComment", productId, episodeId],
      });
      setToast({ message: "댓글이 등록되었습니다.", type: "success" });
    } catch (error) {
      setToast({ message: "댓글 등록에 실패했습니다.", type: "error" });
    } finally {
      submittingRef.current = false;
    }
  });

  const handleSelectQuickComment = (quickComment: string) => {
    if (!isCommentOpen) return;
    setComment(quickComment);
    commentInputRef.current?.focus();
  };

  const updateChipScrollState = useCallback(() => {
    const scroller = chipScrollRef.current;
    if (!scroller) return;

    const maxScrollLeft = Math.max(
      0,
      scroller.scrollWidth - scroller.clientWidth
    );
    setCanScrollChipsLeft(scroller.scrollLeft > 1);
    setCanScrollChipsRight(scroller.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const scroller = chipScrollRef.current;
    if (!scroller) return;

    updateChipScrollState();
    const resizeObserver = new ResizeObserver(() => {
      updateChipScrollState();
    });
    resizeObserver.observe(scroller);
    window.addEventListener("resize", updateChipScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateChipScrollState);
    };
  }, [updateChipScrollState]);

  const handleScrollChips = (direction: "previous" | "next") => {
    const scroller = chipScrollRef.current;
    if (!scroller) return;

    const currentLeft = scroller.scrollLeft;
    const scrollerLeft = scroller.getBoundingClientRect().left;
    const chipOffsets = Array.from(scroller.children).map(
      (chip) =>
        (chip as HTMLElement).getBoundingClientRect().left -
        scrollerLeft +
        currentLeft
    );
    const targetLeft =
      direction === "next"
        ? chipOffsets.find((offset) => offset > currentLeft + 1)
        : chipOffsets.findLast((offset) => offset < currentLeft - 1);

    const maxScrollLeft = Math.max(
      0,
      scroller.scrollWidth - scroller.clientWidth
    );

    scroller.scrollTo({
      left:
        targetLeft ?? (direction === "previous" ? 0 : maxScrollLeft),
      behavior: "smooth",
    });
  };

  const chipNavigationButtonClass = `mb-2pxr flex h-24pxr w-24pxr shrink-0 items-center justify-center rounded-full border text-13pxr leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100/30 ${
    isDarkTheme
      ? "border-dark-gray-500 text-dark-gray-100 hover:border-primary-100 hover:text-primary-100"
      : "border-light-gray-500 text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
  }`;

  return (
    <section
      aria-label="회차 댓글"
      className="mt-10pxr w-full rounded-[20px] px-18pxr py-16pxr tracking-[-2%] md:px-22pxr"
    >
      <div className="flex h-20pxr items-center justify-between">
        <div className="flex items-baseline gap-6pxr">
          <h2
            className={`text-15pxr font-bold leading-20pxr md:text-16pxr ${
              isDarkTheme ? "text-white" : "text-black-100"
            }`}
          >
            댓글
          </h2>
          <span
            className="text-14pxr font-bold leading-20pxr text-primary-100"
          >
            {commentTotalCount.toLocaleString("ko-KR")}
          </span>
        </div>
      </div>

      <div
        className={`mt-10pxr flex h-44pxr w-full items-center rounded-lg border bg-transparent pl-12pxr pr-6pxr transition-colors ${
          isDarkTheme
            ? isCommentOpen
              ? "border-dark-gray-500 focus-within:border-primary-100"
              : "border-dark-gray-600"
            : isCommentOpen
              ? "border-light-gray-500 focus-within:border-primary-100"
              : "border-light-gray-300"
        }`}
      >
        <input
          ref={commentInputRef}
          type="text"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              handleSubmitComment();
            }
          }}
          placeholder={
            isCommentOpen ? "댓글을 남겨보세요" : "댓글이 비허용된 상태입니다."
          }
          disabled={!isCommentOpen}
          aria-label="댓글 입력"
          className={`min-w-0 flex-1 bg-transparent text-13pxr font-normal leading-[18px] outline-none disabled:cursor-not-allowed ${
            isDarkTheme
              ? "text-white placeholder:text-dark-gray-200"
              : "text-black-100 placeholder:text-dark-gray-300"
          }`}
        />
        <button
          type="button"
          aria-label="댓글 등록"
          onClick={() => handleSubmitComment()}
          disabled={!canSubmit}
          className="ml-8pxr shrink-0 transition disabled:opacity-40 disabled:grayscale"
        >
          <SendComment aria-hidden="true" className="h-32pxr w-34pxr" />
        </button>
      </div>

      <div className="mt-8pxr flex items-center gap-6pxr">
        {canScrollChipsLeft ? (
          <button
            type="button"
            aria-label="빠른 댓글 이전"
            onClick={() => handleScrollChips("previous")}
            className={chipNavigationButtonClass}
          >
            ‹
          </button>
        ) : null}
        <div
          ref={chipScrollRef}
          aria-label="빠른 댓글"
          data-lastpage-interactive="true"
          onScroll={updateChipScrollState}
          className="flex min-w-0 flex-1 gap-8pxr overflow-x-auto pb-2pxr [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {QUICK_COMMENT_CHIPS.map((quickComment) => (
            <button
              key={quickComment}
              type="button"
              onClick={() => handleSelectQuickComment(quickComment)}
              disabled={!isCommentOpen}
              className={`${
                isDarkTheme
                  ? QUICK_COMMENT_CHIP_DARK_CLASS
                  : QUICK_COMMENT_CHIP_CLASS
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {quickComment}
            </button>
          ))}
        </div>
        {canScrollChipsRight ? (
          <button
            type="button"
            aria-label="빠른 댓글 다음"
            onClick={() => handleScrollChips("next")}
            className={chipNavigationButtonClass}
          >
            ›
          </button>
        ) : null}
      </div>

      {previewComments.length > 0 ? (
        <ul
          className={`mt-14pxr border-t pt-4pxr ${
            isDarkTheme ? "border-dark-gray-600" : "border-light-gray-300"
          }`}
        >
          {previewComments.map((previewComment) => (
            <li
              key={previewComment.commentId}
              className={`border-b py-12pxr last:border-b-0 ${
                isDarkTheme ? "border-dark-gray-600" : "border-light-gray-300"
              }`}
            >
              <div className="flex items-center gap-6pxr">
                <span
                  className={`truncate text-12pxr font-semibold leading-[16px] ${
                    isDarkTheme ? "text-white" : "text-black-100"
                  }`}
                >
                  {previewComment.userNickname}
                </span>
                <span
                  className="shrink-0 text-11pxr font-normal leading-[16px] text-dark-gray-300"
                >
                  {dayjs(previewComment.publishDate).format("YYYY.MM.DD")}
                </span>
              </div>
              <p
                className={`mt-4pxr line-clamp-2 text-13pxr font-normal leading-[19px] ${
                  isDarkTheme ? "text-light-gray-300" : "text-dark-gray-600"
                }`}
              >
                {previewComment.content}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => handleCommentState()}
        className={`mt-12pxr flex h-36pxr w-full items-center justify-center gap-2pxr rounded-lg text-12pxr font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100/30 ${
          isDarkTheme
            ? "text-dark-gray-100 hover:text-primary-100"
            : "bg-light-gray-100 text-dark-gray-500 hover:bg-light-gray-200"
        }`}
      >
        댓글 전체보기
        <span aria-hidden="true" className="text-14pxr leading-none">
          ›
        </span>
      </button>
    </section>
  );
}

"use client";

import {
  useLikeEpisode,
  useSelectViewerPath,
  useUnLikeEpisode,
} from "@/app/api/query/episode";
import { useAuthWrapper } from "@/hooks/useAuthWrapper";
import useToastStore from "@/store/toastStore";
import useViewStore from "@/store/viewerStore";
import { useEffect, useState } from "react";
import CommentFilled from "/public/images/comment-filled.svg";
import ThumbsUpBlue from "/public/images/thumbs-up-blue.svg";
import ThumbsUp from "/public/images/thumbs-up.svg";

interface AuthorNoteProps {
  episodeId: number;
}

export default function AuthorNote({ episodeId }: AuthorNoteProps) {
  const { data: episodeData } = useSelectViewerPath(episodeId);
  const { withAuth } = useAuthWrapper();
  const { setToast } = useToastStore();
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));
  const likeEpisode = useLikeEpisode();
  const unLikeEpisode = useUnLikeEpisode();

  const [isLiked, setIsLiked] = useState(false);

  const authorComment = episodeData?.data?.authorComment;
  const liked = episodeData?.data?.liked;
  const isDarkTheme = settings.theme === "dark";

  useEffect(() => {
    setIsLiked(liked === "Y");
  }, [liked]);

  const handleThumbsClick = withAuth(async () => {
    if (!authorComment) return;
    // try {
    //   setIsLiked(!isLiked);
    //   if (!isLiked) {
    //     await likeEpisode.mutateAsync(episodeId);
    //     setToast({
    //       message: "좋아요를 눌렀습니다.",
    //       type: "success",
    //     });
    //   } else {
    //     await unLikeEpisode.mutateAsync(episodeId);
    //     setToast({
    //       message: "좋아요를 취소했습니다.",
    //       type: "success",
    //     });
    //   }
    // } catch (error) {
    //   setToast({
    //     message: "좋아요 변경에 실패했습니다.",
    //     type: "error",
    //   });
    //   setIsLiked(isLiked);
    // }
  });

  return (
    <section
      className={`w-full rounded-[20px] border border-line shadow-card p-4 px-[22px] sm:p-5 ${
        isDarkTheme ? "bg-[#2B2F35]" : "bg-transparent"
      }`}
    >
      <div className="relative">
        <div className="flex items-center gap-[8px]">
          <CommentFilled
            className={`h-6 w-6 ${
              isDarkTheme ? "brightness-0 invert" : "text-white/90"
            }`}
          />
          <p
            className={`text-xl font-semibold leading-[21px] tracking-[-2%] ${
              isDarkTheme ? "text-white" : ""
            }`}
          >
            작가의 한마디
          </p>
        </div>
        <div className="mt-[11px] flex-1 pl-[28px]">
          <p
            className={`text-base font-normal leading-[20px] tracking-[-2%] ${
              isDarkTheme ? "text-white" : "text-[#2C3038]"
            }`}
          >
            {authorComment || ""}
          </p>
        </div>
        <button
          onClick={handleThumbsClick}
          disabled={likeEpisode.isPending || unLikeEpisode.isPending}
          className={`ml-2 rounded-lg transition absolute right-0 bottom-0 disabled:opacity-50 ${
            isDarkTheme
              ? "bg-white/5 text-white hover:bg-white/10"
              : "hover:bg-white/5"
          }`}
          aria-label="like"
        >
          {isLiked ? (
            <ThumbsUpBlue className="w-[27px] h-[22px]" />
          ) : (
            <ThumbsUp className="w-[27px] h-[22px]" />
          )}
        </button>
      </div>
    </section>
  );
}

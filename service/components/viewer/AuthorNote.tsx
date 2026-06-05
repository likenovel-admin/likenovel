"use client";

import { useSelectViewerPath } from "@/app/api/query/episode";
import useViewStore from "@/store/viewerStore";
import CommentFilled from "/public/images/comment-filled.svg";

interface AuthorNoteProps {
  episodeId: number;
}

export default function AuthorNote({ episodeId }: AuthorNoteProps) {
  const { data: episodeData } = useSelectViewerPath(episodeId);
  const { settings } = useViewStore((state) => ({
    settings: state.settings,
  }));

  const authorComment = episodeData?.data?.authorComment;
  const isDarkTheme = settings.theme === "dark";

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
      </div>
    </section>
  );
}

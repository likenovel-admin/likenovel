import { useSelectCommentByEpisode } from "@/app/api/query/comment";
import SquareBadge from "@/components/common/SquareBadge";
import dayjs from "dayjs";
import Image from "next/image";
import Comment from "/public/images/comment.svg";

interface ReviewCardProps {
  productId?: number;
  episodeId?: number;
  handleCommentState: () => void;
}
export default function ReviewCard({
  productId,
  episodeId,
  handleCommentState,
}: ReviewCardProps) {
  const { data: commentData } = useSelectCommentByEpisode(
    productId || 0,
    episodeId || 0,
    1,
    10,
    "recent"
  );
  const comment = commentData?.pages?.[0]?.data?.comments?.[0];
  const commentTotalCount =
    commentData?.pages?.[0]?.data?.commentTotalCount || 0;
  if (!comment) return null;
  return (
    <section className="w-full rounded-[20px] border border-line pt-[17px] pl-[22px] pr-[21px] pb-[23px] mt-[10px]">
      <div className="h-auto flex items-stretch gap-[16px]">
        <div className="rounded-ful">
          <Image
            src={comment.userProfileImagePath}
            alt="프로필"
            width={30}
            height={30}
            className="w-[30px] h-[30px] rounded-full mt-[7px]"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center text-xs text-sub">
            <span className="mr-[8px] font-semibold text-base leading-[18px] text-[#111317] tracking-[-2%]">
              {comment.userNickname}
            </span>
            <Image
              src={comment.userEventLevelBadgeImagePath}
              alt="레벨"
              width={12}
              height={14}
              className="w-[12px] h-[15px]"
            />
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

          <p className="mt-[10px] text-sm leading-[21px] font-normal text-[#2C3038] ">
            {comment.content}
          </p>

          <span className="mt-[11px] font-normal text-[12px] leading-[18px] tracking-[-2%] text-[#6B6E76]">
            {dayjs(comment.postingDate).format("YYYY.MM.DD")}
          </span>
        </div>
        <div className="m-w-[81px] flex flex-col items-end">
          <div className="relative">
            <Comment className="h-[22px] w-[24px]" />
            <span className="absolute bottom-[11px] left-[14px] flex h-[16px] w-[22px] items-center justify-center rounded-[100px] bg-[#111317] text-[11px] font-medium text-white">
              {commentTotalCount}
            </span>
          </div>
          <button
            className="mt-auto rounded-[100px] w-66pxr h-31pxr bg-[#111317] px-[9px] py-[7px] text-[13px] font-normal tracking-[-2%] text-[#F2F4F9]"
            onClick={(e) => {
              e.stopPropagation();
              handleCommentState();
            }}
          >
            <span>평가하기</span>
          </button>
        </div>
      </div>
    </section>
  );
}

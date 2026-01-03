"use client";
import ExclamationTooltip from "@/components/common/ExclamationTooltip";
import VoteTabArea from "@/components/vote/VoteTabArea";

const Page = () => {
  return (
    <div className="mb-[-92px] md:mb-0 max-w-[1120px] mx-auto">
      <div className="text-18pxr md:text-24pxr font-bold mt-9 px-4 flex gap-2 items-center">
        작품에 투표하세요
        <ExclamationTooltip />
      </div>
      <VoteTabArea />
    </div>
  );
};

export default Page;

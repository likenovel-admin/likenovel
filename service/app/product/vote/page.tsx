"use client";
import ExclamationTooltip from "@/components/common/ExclamationTooltip";
import VoteTabArea from "@/components/vote/VoteTabArea";

const Page = () => {
  return (
    <div className="mb-[-92px] md:mb-0 max-w-[1120px] mx-auto">
      <div className="text-18pxr md:text-24pxr font-bold mt-9 px-4 flex gap-2 items-center">
        작품에 투표하세요
        <ExclamationTooltip message="투표한 작품이 선정되면 결과에 따라 보상을 받을 수 있습니다. 진행 중인 투표 일정과 참여 조건을 확인한 뒤 참여해 주세요." />
      </div>
      <VoteTabArea />
    </div>
  );
};

export default Page;

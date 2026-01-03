"use client";
import Image from "next/image";
import { useState } from "react";
import Tab from "../common/Tab";
import VoteHonorListArea from "./VoteHonorListArea";
import VoteListArea from "./VoteListArea";

const VoteTabArea = () => {
  const [type, setType] = useState("progress");
  return (
    <div className="px-4">
      <div className="my-2 text-11pxr md:text-14pxr text-gray-600">
        조회수가 높은 작품을 맞추면 레벨이 부여됩니다!
      </div>
      <Tab
        activeTab={type}
        onTabChange={setType}
        tabs={[
          {
            label: "진행중인 이벤트",
            value: "progress",
          },
          {
            label: "종료된 이벤트",
            value: "end",
          },
        ]}
        style="black"
      />
      <div className="bg-light-gray-100 px-5 py-4 rounded-xl mt-3 flex gap-2">
        <div className="relative w-[22px] h-[16px] md:w-[32px] md:h-[25px]">
          <Image src="/images/stopwatch.svg" alt="진행중인 이벤트" fill />
        </div>
        <div className="flex flex-col md:flex-row md:justify-between w-full md:items-center">
          <div className="text-13pxr md:text-14pxr leading-3">
            {type === "progress" ? (
              <>
                투표 종료까지 : <b>167시간 59분 59초 남음</b>
              </>
            ) : (
              <>
                투표기간 <b>2024.03.05 ~ 2024.05.05</b>
              </>
            )}
          </div>
          {type === "progress" ? (
            <div className="text-11pxr md:text-13pxr text-dark-gray-300">
              남은 투표권 수:{" "}
              <span className="text-primary-100 leading-6">000장</span>
            </div>
          ) : (
            <div className="text-11pxr md:text-13pxr text-dark-gray-300">
              총 <b className="text-black-100">000명</b> 참여 인원중
              <span className="text-primary-100 leading-6">00명</span>레벨 상승
            </div>
          )}
        </div>
      </div>
      <VoteListArea type={type} />
      {type === "end" && <VoteHonorListArea />}
    </div>
  );
};

export default VoteTabArea;

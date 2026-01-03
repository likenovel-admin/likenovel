"use client";
import Image from "next/image";
import { useState } from "react";
import Tab from "../common/Tab";
import PromotionListArea from "./PromotionListArea";

const PromotionTabArea = () => {
  const [type, setType] = useState("waitForFree");
  return (
    <div className="px-4 md:px-0 w-full max-w-[1120px] mx-auto">
      <div className=" contents md:hidden">
        <div className="text-18pxr md:text-24pxr font-bold mt-4 px-2">
          프로모션
        </div>
        <Tab
          activeTab={type}
          onTabChange={setType}
          tabs={[
            {
              label: "기다리면 무료",
              value: "waitForFree",
            },
            {
              label: "69패스",
              value: "69",
            },
            {
              label: "이번주의 선물함",
              value: "gift",
            },
          ]}
          style="underline"
        />
      </div>
      <div className="hidden md:block">
        <div className="text-18pxr md:text-24pxr font-bold mt-4 mb-2">
          프로모션
        </div>
        <Tab
          activeTab={type}
          onTabChange={setType}
          tabs={[
            {
              label: "기다리면 무료",
              value: "waitForFree",
            },
            {
              label: "69패스",
              value: "69",
            },
            {
              label: "이번주의 선물함",
              value: "gift",
            },
          ]}
          style="halfSquare"
        />
      </div>
      <div className="flex gap-4 py-5 pb-7 ">
        <Image
          src={"/images/icon_promotion_tab.png"}
          alt="waitForFree"
          width={38}
          height={38}
          className="hidden md:block h-[38px] w-[38px]"
        />
        <ul className="list-inside list-disc text-11pxr md:text-14pxr text-gray-600 border-b">
          <li>3시간 간격으로 기다리면 무료로 감상할 수 있는 서비스입니다.</li>
          <li>
            기다리면 무료 이용권을 사용 후, 3시간을 기다리면 이용권 1장을
            드립니다.
          </li>
          <li>해당 이용권을 사용한 회차는 3일동안 볼 수 있습니다.</li>
          <li>최신 10편(무료편 포함)은 해당 이용권으로 볼 수 없습니다.</li>
          <li>매주 월요일에 신규 기다리면 무료 작품이 갱신됩니다</li>
        </ul>
      </div>
      <PromotionListArea type={type} />
    </div>
  );
};

export default PromotionTabArea;

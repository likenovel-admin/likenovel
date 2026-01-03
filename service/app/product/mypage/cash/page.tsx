"use client";
import Tab from "@/components/common/Tab";
import CashCharge from "@/components/mypage/CashCharge";
import CashUseHistory from "@/components/mypage/CashUseHistory";
import PossessionCash from "@/components/mypage/PossessionCash";
import { useState } from "react";

const Page = () => {
  const [type, setType] = useState("cash");

  return (
    <div className="pt-[30px] px-4 pb-[10px] md:pt-11 md:pb-8 flex md:items-center flex-col md:w-[555px] md:mx-auto">
      <span className="text-18pxr md:text-24pxr font-semibold pb-[10px] md:pb-8">
        캐쉬
      </span>
      <Tab
        activeTab={type}
        onTabChange={setType}
        tabs={[
          {
            label: "캐쉬 충전",
            value: "cash",
          },
          {
            label: "사용 내역",
            value: "cashHistory",
          },
        ]}
        style="black"
      />
      <div className="h-4"></div>
      <PossessionCash />
      {type === "cash" ? <CashCharge /> : <CashUseHistory />}
    </div>
  );
};

export default Page;

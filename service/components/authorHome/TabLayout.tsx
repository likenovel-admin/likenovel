"use client";

import MyProductManageArea from "@/components/authorHome/MyProductManageArea";
import MyProductManageAreaMobile from "@/components/authorHome/MyProductManageAreaMobile";
import Tab from "@/components/common/Tab";
import { moveToPartnerSettlementWithRelay } from "@/utils/partnerRelay";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function TabLayout({
  activeTab,
  children,
}: {
  activeTab: string;
  children: ReactNode;
}) {
  const router = useRouter();

  const handleChangeTab = (tabName: string) => {
    if (tabName === "myProduct") {
      router.push(`/product/author`);
      // TODO: 정산/통계 페이지로 이동
    } else if (tabName === "settlement") {
      void moveToPartnerSettlementWithRelay();
    } else {
      router.push(`/product/author/${tabName}`);
    }
  };
  return (
    <div className="flex flex-col w-full max-w-[1120px] mx-auto bg-white">
      <span className="text-17pxr md:text-24pxr font-bold md:mb-15pxr pl-16pxr md:pl-0">
        작가 홈
      </span>
      <div className="md:hidden">
        <Tab
          tabs={[
            { label: "내 작품 관리", value: "myProduct" },
            { label: "받은 제안", value: "offer" },
            { label: "프로모션", value: "promotion" },
            { label: "정산/통계", value: "settlement" },
          ]}
          style="underline"
          activeTab={activeTab}
          onTabChange={handleChangeTab}
        />
        {activeTab === "myProduct" && <MyProductManageAreaMobile />}
      </div>
      <div className="hidden md:block">
        <Tab
          tabs={[
            { label: "내 작품 관리", value: "myProduct" },
            { label: "받은 제안", value: "offer" },
            { label: "프로모션", value: "promotion" },
            { label: "정산/통계", value: "settlement" },
          ]}
          style="halfSquare"
          activeTab={activeTab}
          onTabChange={handleChangeTab}
        />
        {activeTab === "myProduct" && <MyProductManageArea />}
      </div>
      {children}
    </div>
  );
}

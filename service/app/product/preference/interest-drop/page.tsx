"use client";

import Tab from "@/components/common/Tab";
import ProductArea from "@/components/preference/ProductArea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InterestDrop() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("interestDrop");
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  useEffect(() => {
    if (activeTab === "preference") {
      router.push("/product/preference");
    } else if (activeTab === "lastViewed") {
      router.push("/product/preference/last-viewed");
    }
  }, [activeTab, router]);
  return (
    <div className="w-full max-w-[1120px] mx-auto flex flex-col">
      <div className="pl-16pxr md:pl-0">
        <Tab
          tabs={[
            { label: "선호작", value: "preference" },
            { label: "관심 끊기기 임박", value: "interestDrop" },
            { label: "최근 본 작품", value: "lastViewed" },
          ]}
          style="black"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      <ProductArea pageType="interestDrop" hasGle={false} />
    </div>
  );
}

"use client";
import { useSelectBannerPromotionPaid } from "@/app/api/query/product";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import Carousel from "@/components/main/Carousel";
import CPPromotion from "@/components/main/CPPromotion";
import End from "@/components/paid/End";
import Ongoing from "@/components/paid/Ongoing";
import { useState } from "react";

export default function Paid() {
  const { data, isSuccess } = useSelectBannerPromotionPaid();
  const cpPromotionProducts = Array.isArray(data?.publisherPromotionProducts)
    ? data.publisherPromotionProducts.slice(0, 12)
    : [];
  const [activeTab, setActiveTab] = useState("ongoing");
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  return (
    <>
      {isSuccess ? (
        <div className="w-full flex flex-col">
          <div className="h-[320px] md:h-[360px] bg-black-100 mt-[-20px]">
            <div className="mt-[20px]">
              <Carousel primaryPanels={data?.banners || []} />
            </div>
          </div>
          <div className="w-full max-w-[1120px] mx-auto flex flex-col mt-70pxr md:mt-[100px]">
            <CPPromotion data={cpPromotionProducts} />
            <div className="pl-16pxr md:pl-0 mt-50pxr">
              <Tab
                tabs={[
                  { label: "연재중", value: "ongoing" },
                  { label: "완결", value: "end" },
                ]}
                style="black"
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
            {activeTab === "ongoing" ? <Ongoing /> : <End />}
          </div>
        </div>
      ) : (
        <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
          <Spinner />
        </div>
      )}
    </>
  );
}

"use client";
import { useSelectBannerPromotionPaid } from "@/app/api/query/product";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import Carousel from "@/components/main/Carousel";
import CPPromotion from "@/components/main/CPPromotion";
import End from "@/components/paid/End";
import Ongoing from "@/components/paid/Ongoing";
import Standalone from "@/components/paid/Standalone";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";
import { useState } from "react";

export default function Paid() {
  const { data, isSuccess } = useSelectBannerPromotionPaid();
  const cpPromotionProducts = Array.isArray(data?.publisherPromotionProducts)
    ? data.publisherPromotionProducts.slice(0, 12)
    : [];
  const [activeTab, setActiveTab] = useState("end");
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  return (
    <>
      {isSuccess ? (
        <div className="relative w-full flex flex-col max-w-[1120px] mx-auto">
          <div className="bg-black-100 h-[385px] w-[100vw] absolute top-[-20px] left-1/2 -translate-x-1/2"></div>
          <Carousel primaryPanels={data?.banners || []} contained />
          <div className="w-full flex flex-col mt-70pxr md:mt-[100px]">
            <CPPromotion
              data={cpPromotionProducts}
              title={data?.publisherPromotionTitle}
              entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PAID_CP_PROMOTION}
            />
            <div className="pl-16pxr md:pl-0 mt-50pxr">
              <Tab
                tabs={[
                  { label: "연재중", value: "ongoing" },
                  { label: "단행본", value: "standalone" },
                  { label: "연재완결", value: "end" },
                ]}
                style="black"
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
            {activeTab === "ongoing" ? (
              <Ongoing />
            ) : activeTab === "standalone" ? (
              <Standalone />
            ) : (
              <End />
            )}
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

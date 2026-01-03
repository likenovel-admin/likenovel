"use client";

import { useGetRecentProduct } from "@/app/api/query/product";
import Tab from "@/components/common/Tab";
import ProductArea from "@/components/preference/ProductArea";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LastViewed() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("lastViewed");
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const adultYn = user?.isOnAdult ? "Y" : "N";

  // Old logic: Get products from localStorage
  // const products = JSON.parse(
  //   localStorage.getItem("recent_viewed_products") || "[]"
  // ) as IProduct[];

  // New logic: Use API to get recent products if authenticated, otherwise use localStorage
  const { data: recentProductsData } = useGetRecentProduct(
    undefined,
    adultYn,
    isAuthenticated
  );

  const products = isAuthenticated ? recentProductsData?.data || [] : [];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  useEffect(() => {
    if (activeTab === "preference") {
      router.push("/product/preference");
    } else if (activeTab === "interestDrop") {
      router.push("/product/preference/interest-drop");
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
      <ProductArea
        products={products || []}
        pageType="lastViewed"
        hasGle={false}
      />
    </div>
  );
}

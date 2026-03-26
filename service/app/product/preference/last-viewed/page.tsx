"use client";

import { useGetRecentProduct } from "@/app/api/query/product";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import ProductArea from "@/components/preference/ProductArea";
import useAuthStore from "@/store/authStore";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LastViewed() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("lastViewed");
  const { user, isAuthenticated, accessToken, isAuthInitialized } =
    useAuthStore();
  const canAccessPreference = Boolean(
    isAuthenticated || accessToken || user?.userId
  );
  const recentProductsCacheIdentity =
    String(user?.userId || "") || accessToken || "guest";
  const canFetchRecentProducts = Boolean(user?.userId);
  const adultYn = user?.isOnAdult ? "Y" : "N";

  // Old logic: Get products from localStorage
  // const products = JSON.parse(
  //   localStorage.getItem("recent_viewed_products") || "[]"
  // ) as IProduct[];

  // New logic: Use API to get recent products if authenticated, otherwise use localStorage
  const { data: recentProductsData } = useGetRecentProduct(
    undefined,
    adultYn,
    canFetchRecentProducts,
    recentProductsCacheIdentity
  );

  const products = canFetchRecentProducts ? recentProductsData?.data || [] : [];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (
      !isAuthInitialized ||
      canAccessPreference ||
      typeof window === "undefined"
    ) {
      return;
    }
    const currentPath = window.location.pathname + window.location.search;
    setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
    router.push("/login?modal=open", { scroll: false });
  }, [canAccessPreference, isAuthInitialized, router]);

  useEffect(() => {
    if (!isAuthInitialized || !canAccessPreference) return;
    if (activeTab === "preference") {
      router.push("/product/preference");
    } else if (activeTab === "interestDrop") {
      router.push("/product/preference/interest-drop");
    }
  }, [activeTab, canAccessPreference, isAuthInitialized, router]);

  if (!isAuthInitialized || !canAccessPreference) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
        <Spinner />
      </div>
    );
  }

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

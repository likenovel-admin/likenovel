"use client";
import Tab from "@/components/common/Tab";
import Spinner from "@/components/common/Spinner";
import InterestDropCards from "@/components/preference/InterestDropCards";
import ProductArea from "@/components/preference/ProductArea";
import useAuthStore from "@/store/authStore";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Preference() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, isAuthInitialized } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState("preference");
  const canAccessPreference = Boolean(
    isAuthenticated || accessToken || user?.userId
  );
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
    if (activeTab === "interestDrop") {
      router.push("/product/preference/interest-drop");
    } else if (activeTab === "lastViewed") {
      router.push("/product/preference/last-viewed");
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
    <div className="w-full flex flex-col">
      <div className="h-[350px] bg-black-100 mt-[-50px]">
        <div className="h-[50px]" />
        <div className="w-full max-w-[1120px] mx-auto flex flex-col">
          <div className="mt-20pxr pl-16pxr md:pl-0">
            <Tab
              tabs={[
                { label: "선호작", value: "preference" },
                { label: "관심 끊기기 임박", value: "interestDrop" },
                { label: "최근 본 작품", value: "lastViewed" },
              ]}
              style="white"
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
          <div>
            <div className="w-full mt-12pxr border border-t-dark-gray-600 border-b-0 border-l-0 border-r-0" />
            <InterestDropCards />
          </div>
        </div>
      </div>
      <div className="mt-30pxr">
        <ProductArea pageType="preference" hasGle={false} />
      </div>
    </div>
  );
}

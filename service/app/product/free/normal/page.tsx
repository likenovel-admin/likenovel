"use client";

import Tab from "@/components/common/Tab";
import { GenreProvider } from "@/contexts/GenreContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductArea from "@/components/free/ProductArea";

export default function Normal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("normal");
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  useEffect(() => {
    if (activeTab === "free") {
      router.push("/product/free/free");
    }
  }, [activeTab, router]);
  return (
    <GenreProvider>
      <div className="w-full max-w-[1120px] mx-auto">
        <div className="pl-16pxr md:pl-0">
          <Tab
            tabs={[
              { label: "일반", value: "normal" },
              { label: "자유", value: "free" },
            ]}
            style="black"
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
         <ProductArea pageType="normal" />
      </div>
    </GenreProvider>
  );
}

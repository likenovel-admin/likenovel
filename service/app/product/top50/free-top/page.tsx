"use client";
import { useSelectTop50Products } from "@/app/api/query/top50";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import ProductArea from "@/components/top50/ProductArea";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function FreeTop() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data, isPending, refetch } = useSelectTop50Products("freeTop");

  const freeTopData = useMemo(() => {
    return data?.data.filter((item) => item.area === "freeTop");
  }, [data]);

  const [activeTab, setActiveTab] = useState("freeTop");
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  useEffect(() => {
    if (activeTab === "paidTop") {
      router.push("/product/top50/paid-top");
    }
  }, [activeTab, router]);

  useEffect(() => {
    refetch();
  }, [isAuthenticated]);

  return (
    <div className="w-full max-w-[1120px] mx-auto">
      <div className="pl-16pxr md:pl-0">
        <Tab
          tabs={[
            { label: "무료 TOP50", value: "freeTop" },
            { label: "유료 TOP50", value: "paidTop" },
          ]}
          style="black"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      {isPending ? (
        <div className="h-screen flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <ProductArea
          data={Array.isArray(freeTopData) ? freeTopData : []}
          pageType="free"
        />
      )}
    </div>
  );
}

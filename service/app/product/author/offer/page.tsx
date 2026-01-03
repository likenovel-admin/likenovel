"use client";

import OfferList from "@/components/authorHome/OfferList";
import Tab from "@/components/common/Tab";
import Spinner from "@/components/common/Spinner";
import { useSelectUserContractOffers } from "@/app/api/query/mypage/user";
import { useState } from "react";

const Page = () => {
  const [type, setType] = useState("latest");
  const { data, isLoading } = useSelectUserContractOffers();
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
        <Spinner />
      </div>
    );
  }

  const offerCount = data?.data?.length || 0;

  return (
    <div className="w-full h-auto">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto px-4 pt-8 pb-4">
        <div className="font-semibold text-14pxr md:text-16pxr mb-3">
          확인하지 않은 제안<span className="text-primary-100 ml-2">{offerCount}</span>
        </div>
        <Tab
          activeTab={type}
          onTabChange={setType}
          tabs={[
            {
              label: "최근 업데이트 순",
              value: "latest",
            },
            {
              label: "가나다 순",
              value: "alphabet",
            },
          ]}
          style="check"
        />
      </div>
      <OfferList data={data?.data || []} sortType={type} />
    </div>
  );
};

export default Page;

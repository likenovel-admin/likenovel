"use client";

import { useSelectUserProductsWithPromotions } from "@/app/api/query/mypage/user";
import PromotionList from "@/components/authorHome/PromotionList";
import BottomSheet from "@/components/common/BottomSheet";
import Modal from "@/components/common/Modal";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import { useState } from "react";

const Page = () => {
  const [type, setType] = useState("latest");
  const { data, isLoading } = useSelectUserProductsWithPromotions();
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center mt-[-100px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full h-auto">
      <div className="flex flex-col w-full max-w-[1120px] mx-auto px-4 pt-8 pb-4">
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
      <PromotionList data={data?.data?.products || []} sortType={type} />
      <Modal size="full" hasCloseButton={false} />
      <div className="md:hidden contents">
        <BottomSheet />
      </div>
    </div>
  );
};

export default Page;

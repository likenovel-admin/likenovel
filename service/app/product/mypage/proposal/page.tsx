"use client";

import { useSelectUserProductContractOffered } from "@/app/api/query/mypage/user";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import ProposalList from "@/components/mypage/ProposalList";
import { useMemo, useState } from "react";

const Page = () => {
  const [type, setType] = useState("title");
  const { data: contractOfferedData, isLoading } =
    useSelectUserProductContractOffered();

  // Sort data based on selected type
  const sortedData = useMemo(() => {
    if (!contractOfferedData?.data) return [];

    const dataCopy = [...contractOfferedData.data];

    if (type === "latest") {
      // Sort by created_date descending (newest first)
      return dataCopy.sort(
        (a, b) =>
          new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    }

    // For "title", we'll keep the original order from API
    // If you need to sort by title, uncomment below:
    // return dataCopy.sort((a, b) => a.product_title?.localeCompare(b.product_title || ''));

    return dataCopy;
  }, [contractOfferedData?.data, type]);

  return (
    <div className="mx-4 md:mx-0">
      <div className="md:text-24pxr text-18pxr font-semibold pt-6 pb-3 md:pt-11 md:pb-8">
        보낸 제안 <span>{contractOfferedData?.data?.length || 0}</span>
      </div>
      <Tab
        activeTab={type}
        onTabChange={setType}
        tabs={[
          {
            label: "제목순",
            value: "title",
          },
          {
            label: "최신순",
            value: "latest",
          },
        ]}
        style="check"
      />
      {isLoading ? (
        <div className="py-20">
          <Spinner />
        </div>
      ) : (
        <ProposalList data={sortedData} />
      )}
    </div>
  );
};

export default Page;

import { useSelectUserCash } from "@/app/api/query/mypage/user";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Spinner from "../common/Spinner";
import Tab from "../common/Tab";
import CashUseItem from "./CashUseItem";

const CashUseHistory = () => {
  const [category, setCategory] = useState<"all" | "charge" | "used">("all");
  const { data: cashData, isLoading } = useSelectUserCash();

  // Filter cash data based on selected category
  const filteredData = cashData?.data?.filter((item) => {
    if (category === "all") {
      return true;
    }
    if (category === "used") {
      return item.category === "used" || item.category === "use";
    }
    return item.category === category;
  });

  return (
    <div className="flex justify-start w-full mt-4">
      <div className="flex flex-col gap-2 w-full">
        <Tab
          activeTab={category}
          onTabChange={(value) => {
            setCategory(value as "all" | "charge" | "used");
          }}
          tabs={[
            {
              label: "전체",
              value: "all",
            },
            {
              label: "충전",
              value: "charge",
            },
            {
              label: "사용",
              value: "used",
            },
          ]}
          style="check"
        />
        {isLoading ? (
          <>
            <Spinner />
          </>
        ) : (
          <>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <CashUseItem key={index} {...item} />
              ))
            ) : (
              <div className="text-center py-20 text-dark-gray-400">
                캐시 사용 내역이 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CashUseHistory;
